"use client";

import Image from "next/image";
import { useCallback, useId, useState } from "react";

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
  cover: SizedImage | null;
  gallery: SizedImage[];
};

type ProjectPortfolioProps = {
  projects: ProjectItem[];
};

export function ProjectPortfolio({ projects }: ProjectPortfolioProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  if (projects.length === 0) {
    return <p className={styles.empty}>No projects yet. Add one in Sanity Studio.</p>;
  }

  return (
    <ul className={styles.list}>
      {projects.map((project, index) => {
        const isOpen = openId === project.id;
        const panelId = `${baseId}-${project.id}-panel`;
        const buttonId = `${baseId}-${project.id}-trigger`;

        return (
          <li key={project.id} className={styles.item}>
            <div className={styles.block}>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(project.id)}
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
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={styles.panel}
            >
              {isOpen &&
                (project.gallery.length > 0 ? (
                  <div className={styles.gallery}>
                    {project.gallery.map((img, i) => (
                      <div key={`${project.id}-${i}`} className={styles.galleryCell}>
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
