"use client";

import { UploadIcon } from "@sanity/icons";
import { Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { randomKey } from "@sanity/util/content";
import { useCallback, useRef, useState } from "react";
import {
  type ArrayOfObjectsInputProps,
  type ObjectItem,
  useClient,
} from "sanity";

import { apiVersion } from "../env";

type ImageArrayItem = ObjectItem & {
  _type: "image";
  asset: { _type: "reference"; _ref: string };
};

export function BatchImageArrayInput(props: ArrayOfObjectsInputProps) {
  const { renderDefault, onItemAppend, readOnly } = props;
  const client = useClient({ apiVersion });
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendImages = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;

      setError(null);
      setBusy(true);
      try {
        for (const file of images) {
          const doc = await client.assets.upload("image", file);
          const item: ImageArrayItem = {
            _type: "image",
            _key: randomKey(12),
            asset: { _type: "reference", _ref: doc._id },
          };
          onItemAppend(item);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [client, onItemAppend],
  );

  const onInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list?.length) return;
      await appendImages([...list]);
      e.target.value = "";
    },
    [appendImages],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (readOnly || busy) return;
      const dt = e.dataTransfer;
      if (!dt.files?.length) return;
      await appendImages([...dt.files]);
    },
    [appendImages, busy, readOnly],
  );

  return (
    <Stack space={4}>
      {!readOnly && (
        <Card
          padding={3}
          radius={2}
          shadow={1}
          tone="transparent"
          border
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <Flex direction="column" gap={3}>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={onInputChange}
            />
            <Button
              type="button"
              icon={UploadIcon}
              text={busy ? "Uploading…" : "Batch upload images"}
              mode="ghost"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            />
            <Text size={1} muted>
              Choose multiple files or drag and drop images here. Each file is
              appended to the list below.
            </Text>
            {error ? (
              <Card tone="critical" padding={2} radius={1}>
                <Text size={1}>{error}</Text>
              </Card>
            ) : null}
          </Flex>
        </Card>
      )}
      {renderDefault(props)}
    </Stack>
  );
}
