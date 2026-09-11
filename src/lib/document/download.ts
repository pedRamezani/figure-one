export function downloadBlob(data: BlobPart, mimeType: string, fileName: string): void {
	const blob = new Blob([data], { type: mimeType });

	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = fileName;
	link.click();

	URL.revokeObjectURL(link.href);
}
