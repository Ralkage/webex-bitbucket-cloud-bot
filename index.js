const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(bodyParser.json())

// Load tokens from environment variables
const WEBEX_BOT_TOKEN = process.env.WEBEX_BOT_TOKEN
const WEBEX_ROOM_ID = process.env.WEBEX_ROOM_ID

// Webex API endpoint
const WEBEX_API_URL = "https://webexapis.com/v1/messages"

// Helper function to construct the Webex message
const constructMessage = bitbucketEvent => {
  const { actor, pullrequest, repository } = bitbucketEvent
  const user = actor
  const title = pullrequest.title
  const repoName = repository.name
  const repoHtmlUrl = repository.links.html.href // Repository HTML link
  const prHtmlUrl = pullrequest.links.html.href // Pull request HTML link
  const actorProfileHtmlUrl = user.links.html.href // Actor profile HTML link
  const state = pullrequest.state.toLowerCase()

  let message

  // TODO: Add more supported Bitbucket webhook event states
  // https://support.atlassian.com/bitbucket-cloud/docs/event-payloads/
  switch (state) {
    case "declined":
      message = `[${user.display_name}](${actorProfileHtmlUrl}) declined the pull request [${title}](${prHtmlUrl}) in the [${repoName}](${repoHtmlUrl}) repository.`
      break
    case "approved":
      message = `[${user.display_name}](${actorProfileHtmlUrl}) approved the pull request [${title}](${prHtmlUrl}) in the [${repoName}](${repoHtmlUrl})repository.`
      break
    case "open":
      message = `[${user.display_name}](${actorProfileHtmlUrl}) created the new pull request [${title}](${prHtmlUrl}) in the [${repoName}](${repoHtmlUrl}) repository.`
      break
    case "updated":
      message = `[${user.display_name}](${actorProfileHtmlUrl}) updated the pull request [${title}](${prHtmlUrl}) in the [${repoName}](${repoHtmlUrl}) repository.`
      break
    default:
      message = `Unhandled event state: ${state}`
  }

  return message
}

// Webhook endpoint to receive Bitbucket messages
app.post("/webhook", async (req, res) => {
  const bitbucketEvent = req.body
  const message = constructMessage(bitbucketEvent)

  try {
    await axios.post(
      WEBEX_API_URL,
      {
        roomId: WEBEX_ROOM_ID,
        markdown: message,
      },
      {
        headers: {
          Authorization: `Bearer ${WEBEX_BOT_TOKEN}`,
        },
      }
    )

    res.status(200).send("Message sent to Webex")
  } catch (error) {
    console.error("Error sending message to Webex:", error)
    res.status(500).send("Error sending message to Webex")
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
