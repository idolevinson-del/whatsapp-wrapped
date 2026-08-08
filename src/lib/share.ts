/**
 * Renders a DOM node to a PNG and either opens the native share sheet
 * (so it can be shared directly to WhatsApp/Instagram/Facebook etc.) or,
 * if the platform doesn't support sharing files, downloads the image.
 */
export async function shareOrDownloadImage(
  node: HTMLElement,
  options: { fileName: string; title?: string; text?: string }
): Promise<void> {
  const { toBlob } = await import('html-to-image');
  const blob = await toBlob(node, { pixelRatio: 2 });
  if (!blob) {
    throw new Error('Failed to generate image');
  }

  const file = new File([blob], options.fileName, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: options.title, text: options.text });
    return;
  }

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = options.fileName;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
