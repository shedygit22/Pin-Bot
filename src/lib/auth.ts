const DEMO_USER_ID = "demo-user-id";
const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "demo@pinbot.app",
  name: "Demo User",
};

export async function auth() {
  return { user: DEMO_USER };
}
