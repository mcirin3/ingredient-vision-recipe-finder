export interface AnalyzeResponse {
  ingredients_raw: string[];
  ingredients_normalized: string[];
}

export interface UploadUrlResponse {
  key: string;
  url: string;
  method: 'PUT';
}
