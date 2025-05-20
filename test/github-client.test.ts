import { GitHubClient } from "../src/github-client";
import { requestUrl } from "obsidian";

// requestUrl をモック
jest.mock("obsidian", () => ({
  requestUrl: jest.fn(),
}));

describe("GitHubClient", () => {
  const client = new GitHubClient({ token: "tok", repo: "u/r", inboxDir: "inbox" });

  it("handles empty inbox", async () => {
    (requestUrl as jest.Mock).mockResolvedValue({ status: 404 });
    const list = await client.listInbox();
    expect(list).toEqual([]);
  });
});
