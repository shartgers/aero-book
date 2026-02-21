/**
 * Neon PostgREST client
 *
 * Provides typed helpers for querying the Neon PostgreSQL REST API
 * (PostgREST endpoint) with optional JWT Bearer token authentication.
 *
 * REST API base URL: https://ep-curly-cherry-ag5axgm4.apirest.c-2.eu-central-1.aws.neon.tech/neondb/rest/v1
 * Auth URL:         https://ep-curly-cherry-ag5axgm4.neonauth.c-2.eu-central-1.aws.neon.tech/neondb/auth
 */

const NEON_API_URL =
  process.env.NEON_API_URL ??
  "https://ep-curly-cherry-ag5axgm4.apirest.c-2.eu-central-1.aws.neon.tech/neondb/rest/v1";

type QueryParams = Record<string, string>;

interface RequestOptions {
  /** JWT Bearer token for authenticated requests (Neon Authorize) */
  token?: string;
  /** Additional headers */
  headers?: Record<string, string>;
}

function buildHeaders(options?: RequestOptions): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options?.headers,
  };

  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  return headers;
}

function buildUrl(table: string, params?: QueryParams): string {
  const url = new URL(`${NEON_API_URL}/${table}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

/**
 * SELECT rows from a table.
 * @param table  PostgREST table/view name
 * @param params PostgREST query parameters (e.g. { select: "id,email", email: "eq.user@example.com" })
 * @param options Request options (token, extra headers)
 */
export async function neonSelect<T = unknown>(
  table: string,
  params?: QueryParams,
  options?: RequestOptions
): Promise<T[]> {
  const res = await fetch(buildUrl(table, params), {
    method: "GET",
    headers: buildHeaders(options),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Neon API GET /${table} failed (${res.status}): ${error}`);
  }

  return res.json() as Promise<T[]>;
}

/**
 * INSERT a row into a table.
 * @param table   PostgREST table name
 * @param payload Row data to insert
 * @param options Request options (token, extra headers)
 */
export async function neonInsert<T = unknown>(
  table: string,
  payload: Record<string, unknown>,
  options?: RequestOptions
): Promise<T> {
  const res = await fetch(buildUrl(table), {
    method: "POST",
    headers: {
      ...buildHeaders(options),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Neon API POST /${table} failed (${res.status}): ${error}`);
  }

  const rows = (await res.json()) as T[];
  return rows[0];
}

/**
 * UPDATE rows in a table.
 * @param table   PostgREST table name
 * @param params  Filter parameters (e.g. { id: "eq.some-uuid" })
 * @param payload Fields to update
 * @param options Request options (token, extra headers)
 */
export async function neonUpdate<T = unknown>(
  table: string,
  params: QueryParams,
  payload: Record<string, unknown>,
  options?: RequestOptions
): Promise<T[]> {
  const res = await fetch(buildUrl(table, params), {
    method: "PATCH",
    headers: {
      ...buildHeaders(options),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(
      `Neon API PATCH /${table} failed (${res.status}): ${error}`
    );
  }

  return res.json() as Promise<T[]>;
}

/**
 * DELETE rows from a table.
 * @param table   PostgREST table name
 * @param params  Filter parameters (e.g. { id: "eq.some-uuid" })
 * @param options Request options (token, extra headers)
 */
export async function neonDelete(
  table: string,
  params: QueryParams,
  options?: RequestOptions
): Promise<void> {
  const res = await fetch(buildUrl(table, params), {
    method: "DELETE",
    headers: buildHeaders(options),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(
      `Neon API DELETE /${table} failed (${res.status}): ${error}`
    );
  }
}
