import axios from "axios";

const PINTEREST_API = "https://api.pinterest.com/v5";

interface PinterestCredentials {
  accessToken: string;
  refreshToken?: string;
}

export async function getPinterestBoards(accessToken: string) {
  try {
    const response = await axios.get(`${PINTEREST_API}/boards`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page_size: 50 },
    });
    return response.data?.items || [];
  } catch (error: any) {
    console.error("Failed to fetch Pinterest boards:", error?.response?.data || error);
    throw error;
  }
}

export async function createPinterestPin(
  accessToken: string,
  pinData: {
    boardId: string;
    title: string;
    description: string;
    link: string;
    imageUrl: string;
    altText?: string;
  }
) {
  try {
    const response = await axios.post(
      `${PINTEREST_API}/pins`,
      {
        board_id: pinData.boardId,
        title: pinData.title,
        description: pinData.description,
        link: pinData.link,
        media_source: {
          source_type: "image_url",
          url: pinData.imageUrl,
        },
        alt_text: pinData.altText || "",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Failed to create Pinterest pin:", error?.response?.data || error);
    throw error;
  }
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await axios.post(
      "https://api.pinterest.com/v5/oauth/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.PINTEREST_CLIENT_ID!,
        client_secret: process.env.PINTEREST_CLIENT_SECRET!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken,
      expiresIn: response.data.expires_in,
    };
  } catch (error: any) {
    console.error("Failed to refresh Pinterest token:", error?.response?.data || error);
    throw error;
  }
}

export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await axios.get(`${PINTEREST_API}/user_account`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

export async function getPinAnalytics(
  accessToken: string,
  pinId: string,
  startDate: string,
  endDate: string
) {
  try {
    const response = await axios.get(
      `${PINTEREST_API}/pins/${pinId}/analytics`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate,
          end_date: endDate,
          metric_types: "IMPRESSION,SAVE,CLICK,CLOSEUP",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch pin analytics:", error?.response?.data || error);
    return null;
  }
}

export function buildUtmUrl(
  baseUrl: string,
  campaignName: string,
  contentSlug: string,
  keyword?: string
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "pinterest");
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", campaignName);
  url.searchParams.set("utm_content", contentSlug);
  if (keyword) url.searchParams.set("utm_term", keyword);
  return url.toString();
}
