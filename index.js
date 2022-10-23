const DELAY = 2000;
require("dotenv").config({ path: __dirname + "/.env" });
const axios = require("axios");
const GitHubClient = axios.create({
  baseURL: "https://api.GitHub.com/",
  timeout: 1000,
  headers: {
    Accept: "application/vnd.GitHub.v3+json",
    Authorization: process.env.OCTOKIT_TOKEN,
    //'Authorization': 'token <your-token-here> -- https://docs.GitHub.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token'
  },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (!process.env.OCTOKIT_TOKEN) {
  console.log("OCTOKIT_TOKEN is not defined.");
  process.exit(1);
} else {
  console.log("OCTOKIT_TOKEN is defined.");
}

const { Octokit } = require("@octokit/rest");
// import Octokit from "@octokit/rest";

async function connectGithub() {
  // console.log("Connecting to GitHub with token " + process.env.OCTOKIT_TOKEN);
  const octokit = new Octokit({
    auth: process.env.OCTOKIT_TOKEN,
    // auth: "token " + process.env.OCTOKIT_TOKEN,
  });
  await sleep(DELAY);
  const { data } = await octokit.rateLimit.get();
  console.log(
    `GitHub rate limits: ${data.rate.remaining}/${data.rate.limit}. ` +
      JSON.stringify(data.rate)
  );

  if (data.rate.remaining <= 1000) {
    console.log("WARN: GitHub remaining API calls is less than 1000. Exiting.");
    process.exit();
  }
}

async function getMostFollowedUsers() {
  const noOfFollowers = 35000;
  const perPage = 10;
  //ref: https://docs.GitHub.com/en/GitHub/searching-for-information-on-GitHub/searching-on-GitHub/searching-users
  const response = await GitHubClient.get(
    `search/users?q=followers:>${noOfFollowers}&per_page=${perPage}`,
    // `search/users?q=${process.env.OWNER}&per_page=${perPage}`,
    { timeout: 1500 },
    { Authorization: process.env.OCTOKIT_TOKEN }
  );
  return response.data.items;
}

async function getSpecificUser() {
  const perPage = 1;
  const response = await GitHubClient.get(
    `search/users?q=${process.env.OWNER}&per_page=${perPage}`,
    { timeout: 1500 },
    { Authorization: process.env.OCTOKIT_TOKEN }
  );
  return response.data.items;
}

async function getCounts(username) {
  const response = await GitHubClient.get(`users/${username}`);
  //   console.log(response);
  return {
    username,
    name: response.data.name,
    publicReposCount: response.data.public_repos,
    followersCount: response.data.followers,
  };
}

(async () => {
  try {
    await connectGithub();
    // const mostFollowedUsers = await getMostFollowedUsers();
    // const popularUsernames = mostFollowedUsers.map((user) => user.login);
    // const popularUsersWithPublicRepoCount = await Promise.all(
    //   popularUsernames.map(getCounts)
    // );
    // console.table(popularUsersWithPublicRepoCount);

    // console.log(`======== Another view ========`);

    const specificUser = await getSpecificUser();
    // console.log("specificUser= ", specificUser);

    const specificUsernames = specificUser.map((user) => user.login);
    const specificUsersWithPublicRepoCount = await Promise.all(
      specificUsernames.map(getCounts)
    );
    console.table(specificUsersWithPublicRepoCount);

    // console.log(`======== Yet Another view ========`);
    // popularUsersWithPublicRepoCount.forEach((userWithPublicRepos) => {
    //   console.log(
    //     `${userWithPublicRepos.name} with username ${userWithPublicRepos.username} has ${userWithPublicRepos.publicReposCount} public repos and ${userWithPublicRepos.followersCount} followers on GitHub`
    //   );
    // });
  } catch (error) {
    console.log(`Error calling GitHub API: ${error.message}`, error);
  }
})();
