import * as https from 'https'
import {IContextEnv} from '../types/context'
import {debug, error} from './log'

interface ISlackNotificationParams {
  sourceBranch: string
  targetBranch: string
  repository: string
  serverUrl: string
  runId: string
}

/**
 * Send a Slack notification about merge conflict
 *
 * @export
 * @param {IContextEnv} contextEnv
 * @param {ISlackNotificationParams} params
 * @returns {Promise<void>}
 */
export async function sendSlackMergeConflictNotification(
  contextEnv: IContextEnv,
  params: ISlackNotificationParams
): Promise<void> {
  const {slackWebhook, slackChannel} = contextEnv

  if (!slackWebhook || !slackWebhook.trim()) {
    debug('Slack webhook not configured, skipping notification')
    return
  }

  const {sourceBranch, targetBranch, repository, serverUrl, runId} = params

  const message = {
    channel: slackChannel || undefined,
    username: 'Automerge Bot',
    icon_url: 'https://github.com/rtCamp.png?size=48',
    attachments: [
      {
        color: 'warning',
        title: 'Merge Conflict - Action Required',
        text: `🔀 *Merge Conflict Detected*\n\nA merge conflict occurred while trying to automerge:\n• Source Branch: \`${sourceBranch}\`\n• Target Branch: \`${targetBranch}\`\n• Repository: \`${repository}\`\n\nA pull request has been automatically created for manual resolution.\n\n<${serverUrl}/${repository}/pulls|View Pull Requests>\n<${serverUrl}/${repository}/actions/runs/${runId}|View Workflow Run>`,
        mrkdwn_in: ['text'],
      },
    ],
  }

  try {
    debug('Sending Slack notification for merge conflict', message)

    await sendSlackWebhook(slackWebhook, message)

    debug('Slack notification sent successfully')
  } catch (err) {
    error(err as Error)
    debug('Failed to send Slack notification, but continuing execution')
  }
}

/**
 * Send webhook request to Slack
 *
 * @param {string} webhookUrl
 * @param {any} payload
 * @returns {Promise<void>}
 */
function sendSlackWebhook(webhookUrl: string, payload: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl)
    const data = JSON.stringify(payload)

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }

    const req = https.request(options, (res: any) => {
      let responseData = ''

      res.on('data', (chunk: any) => {
        responseData += chunk
      })

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve()
        } else {
          reject(
            new Error(
              `Slack notification failed with status ${res.statusCode}: ${responseData}`
            )
          )
        }
      })
    })

    req.on('error', (err: Error) => {
      reject(err)
    })

    req.write(data)
    req.end()
  })
}

