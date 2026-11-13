import type { AxiosInstance } from "axios";
import api from "@/src/lib/api";

const PAGE_SIZE = 100;
// Safety net so a misbehaving endpoint can never make the browser loop forever (50 x 100 = 5,000 rows).
const MAX_PAGES = 50;

interface PageShape<T> {
  content?: T[];
  last?: boolean;
  totalPages?: number;
}

/**
 * Reads every page of a paged list endpoint. The services answer with a Spring `Page` (or billing's
 * `PageResponse`) of 20 rows by default, so a plain GET silently drops everything after the first 20 - any
 * total, count or KPI built on it is wrong. A bare array (an endpoint that is not paged) is returned as is.
 */
export async function fetchAllPages<T>(
  url: string,
  params: Record<string, unknown> = {},
  client: AxiosInstance = api
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await client.get(url, { params: { ...params, page, size: PAGE_SIZE } });
    const data = (response.data?.data ?? response.data) as T[] | PageShape<T> | undefined;
    if (Array.isArray(data)) return data;
    const rows = data?.content ?? [];
    all.push(...rows);

    const noMore =
      rows.length < PAGE_SIZE || data?.last === true || (data?.totalPages != null && page + 1 >= data.totalPages);
    if (noMore) break;
  }
  return all;
}
