async function get_user(username) {
  const query = `
    query {
      matchedUser(username: "${username}") {
        username
        contributions { points }
        profile {
          realName
          starRating
          userAvatar
          ranking
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        badges { id icon }
        activeBadge { id }
      }
      recentSubmissionList(username: "${username}", limit: 1) {
        timestamp
      }
      userProfileUserQuestionProgressV2(userSlug: "${username}") {
        numAcceptedQuestions {
          count
          difficulty
        }
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      query: query
    })
  });

  const data = await response.json();

  return data;
}

// -------------------------
// TEST IT
// -------------------------
get_user("leetcode_username").then(data => console.dir(data, { depth: null }));