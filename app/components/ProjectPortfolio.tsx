"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import styles from "./ProjectPortfolio.module.css";

export type SizedImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export type ProjectItem = {
  id: string;
  title: string | null;
  year: string | null;
  expandedGalleryBackground?: string;
  cover: SizedImage | null;
  gallery: SizedImage[];
};

type ProjectPortfolioProps = {
  projects: ProjectItem[];
};

const PAGE_ROOT_SELECTOR = ".page";
const PANEL_CLOSE_MS = 350;

function pickProjectNearestViewportCenter(
  openIds: string[],
  getItem: (id: string) => HTMLLIElement | undefined,
): string | null {
  if (openIds.length === 0) return null;

  const midY = window.innerHeight / 2;
  let best: string | null = null;
  let bestDist = Infinity;

  for (const id of openIds) {
    const el = getItem(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const cy = (r.top + r.bottom) / 2;
    const dist = Math.abs(cy - midY);
    if (dist < bestDist) {
      bestDist = dist;
      best = id;
    }
  }

  return best;
}

export function ProjectPortfolio({ projects }: ProjectPortfolioProps) {
  const baseId = useId();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [closingIds, setClosingIds] = useState<string[]>([]);
  const [viewportBgProjectId, setViewportBgProjectId] = useState<string | null>(null);
  const closeTimersRef = useRef<Map<string, number>>(new Map());
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const listRef = useRef<HTMLUListElement>(null);

  const setItemRef = useCallback((id: string, node: HTMLLIElement | null) => {
    if (node) itemRefs.current.set(id, node);
    else itemRefs.current.delete(id);
  }, []);

  const openIdsKey = [...new Set([...expandedIds, ...closingIds])]
    .slice()
    .sort()
    .join(",");

  const updateViewportBg = useCallback(() => {
    const ids = [...new Set([...expandedIds, ...closingIds])];
    const next = pickProjectNearestViewportCenter(ids, (id) => itemRefs.current.get(id));
    setViewportBgProjectId((prev) => (prev === next ? prev : next));
  }, [expandedIds, closingIds]);

  useLayoutEffect(() => {
    updateViewportBg();
  }, [openIdsKey, updateViewportBg]);

  useEffect(() => {
    window.addEventListener("scroll", updateViewportBg, { passive: true });
    window.addEventListener("resize", updateViewportBg);
    return () => {
      window.removeEventListener("scroll", updateViewportBg);
      window.removeEventListener("resize", updateViewportBg);
    };
  }, [updateViewportBg]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateViewportBg);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateViewportBg]);

  useEffect(
    () => () => {
      closeTimersRef.current.forEach((tid) => clearTimeout(tid));
      closeTimersRef.current.clear();
    },
    [],
  );

  const scheduleRemoveAfterClose = useCallback((id: string) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const closeMs = reduceMotion ? 0 : PANEL_CLOSE_MS;

    const prev = closeTimersRef.current.get(id);
    if (prev !== undefined) clearTimeout(prev);

    const tid = window.setTimeout(() => {
      closeTimersRef.current.delete(id);
      setClosingIds((c) => c.filter((x) => x !== id));
      setExpandedIds((e) => e.filter((x) => x !== id));
    }, closeMs);

    closeTimersRef.current.set(id, tid);
  }, []);

  const select = useCallback(
    (id: string) => {
      if (closingIds.includes(id)) return;

      if (expandedIds.includes(id)) {
        setClosingIds((c) => (c.includes(id) ? c : [...c, id]));
        scheduleRemoveAfterClose(id);
        return;
      }

      setExpandedIds((e) => (e.includes(id) ? e : [...e, id]));
    },
    [expandedIds, closingIds, scheduleRemoveAfterClose],
  );

  useEffect(() => {
    const pageEl = document.querySelector<HTMLElement>(PAGE_ROOT_SELECTOR);
    if (!pageEl) return;

    const bgActive =
      viewportBgProjectId &&
      (expandedIds.includes(viewportBgProjectId) ||
        closingIds.includes(viewportBgProjectId));

    const bg = bgActive
      ? projects.find((p) => p.id === viewportBgProjectId)?.expandedGalleryBackground
      : undefined;

    if (bg) {
      pageEl.style.backgroundColor = bg;
    } else {
      pageEl.style.backgroundColor = "";
    }

    return () => {
      pageEl.style.backgroundColor = "";
    };
  }, [viewportBgProjectId, expandedIds, closingIds, projects]);

  if (projects.length === 0) {
    return <p className={styles.empty}>No projects yet. Add one in Sanity Studio.</p>;
  }

  return (
    <ul ref={listRef} className={styles.list}>
      {projects.map((project, index) => {
        const showPanel =
          expandedIds.includes(project.id) || closingIds.includes(project.id);
        const isLeaving = closingIds.includes(project.id);
        const expanded = showPanel;
        const panelId = `${baseId}-${project.id}-panel`;
        const buttonId = `${baseId}-${project.id}-trigger`;

        return (
          <li key={project.id} ref={(node) => setItemRef(project.id, node)} className={styles.item}>
            <div className={styles.block}>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => select(project.id)}
                className={styles.trigger}
              >
                <div className={styles.coverRow}>
                  {project.cover ? (
                    <Image
                      src={project.cover.url}
                      alt={project.cover.alt}
                      width={project.cover.width}
                      height={project.cover.height}
                      className={styles.coverImage}
                      sizes="(max-width: 768px) 100vw, 48rem"
                      priority={index === 0}
                    />
                  ) : (
                    <div className={styles.placeholder}>No cover image</div>
                  )}
                </div>
                <span className={styles.meta}>
                  {project.title ?? "Untitled"}
                  {project.year ? ` · ${project.year}` : ""}
                </span>
              </button>
            </div>

            <div
              key={showPanel ? "show" : "hide"}
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!showPanel}
              className={`${styles.panel} ${isLeaving ? styles.panelLeaving : styles.panelOpening}`}
            >
              {showPanel &&
                (project.gallery.length > 0 ? (
                  <div key={`${project.id}-open`} className={styles.gallery}>
                    {project.gallery.map((img, i) => (
                      <div
                        key={`${project.id}-${i}`}
                        className={styles.galleryCell}
                        style={{ ["--gallery-stagger" as string]: String(i) }}
                      >
                        <Image
                          src={img.url}
                          alt={img.alt}
                          width={img.width}
                          height={img.height}
                          className={styles.galleryImage}
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyGallery}>No gallery images for this project.</p>
                ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
