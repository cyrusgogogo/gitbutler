import { apiToUpload, type ApiUpload, type Upload } from "$lib/uploads/types";
import { InjectionToken } from "@gitbutler/core/context";
import { LocalizedError, message } from "@gitbutler/i18n";
import type { HttpClient } from "$lib/network/httpClient";

const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

export const UPLOADS_SERVICE: InjectionToken<UploadsService> = new InjectionToken("UploadsService");

export class UploadsService {
	constructor(private readonly httpClient: HttpClient) {}

	async uploadFile(file: File): Promise<Upload> {
		if (file.size > FILE_SIZE_LIMIT) {
			throw new LocalizedError(message("shared:upload.tooLarge"), "File size limit exceeded");
		}

		const formData = new FormData();
		formData.append("file", file);
		formData.append("public", "true");

		const response = await this.httpClient.post<ApiUpload>("uploads", {
			body: formData,
			headers: { "Content-Type": undefined },
		});

		return apiToUpload(response);
	}
}
