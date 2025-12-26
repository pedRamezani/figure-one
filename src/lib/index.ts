export function downloadBlob(data: BlobPart, mimeType: string, fileName: string): void {
	const blob = new Blob([data], { type: mimeType });

	// Creates element with <a> tag
	const link = document.createElement('a');

	// Sets file content in the object URL
	link.href = URL.createObjectURL(blob);

	// Sets file name
	link.download = fileName;

	// Triggers a click event to <a> tag to save file.
	// document.body.appendChild(link);
	link.click();
	// document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}