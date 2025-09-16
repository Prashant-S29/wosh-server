export type GlobalApiResponse<T = unknown> = {
  data: T | null;
  error: string | null;
  message: string;
};

export type InternalApiResponse<T = unknown> = {
  data: T | null;
  errorCode: string | null;
  message: string;
  statusCode: number;
};
