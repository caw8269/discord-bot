/**
 * core server that runs on Cloudflare Worker
 */

import { AutoRouter } from "itty-router";
import {
    InteractionResponseType,
    InteractionType,
    verifyKey
} from 'discord-interactions';
import { AWW_COMMAND, INVITE_COMMAND } from './command.js';
import { InteractionResponseFlags } from 'discord-interactions';

class JsonResponse extends Response{
    constructor(body, init){
        const jsonBody = JSON.stringify(body);
        init = init || {
            headers: {
                'content-type': 'application/json;charset=UTF-8'
            },
        };
        super(jsonBody, init);
    }
}

const router = AutoRouter();

/**
 * A simple :wave: hello page to verify the worker works
 */
router.get('/', (request, env) => {
    return new Response(`👋 ${env.DISCORD_APP_ID}`);
});

async function verifyDiscordRequest(request, env){
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();
    const isValidRequest =
        signature &&
        timestamp &&
        (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
    if(!isValidRequest){
        return { isValid: false};
    }

    return { interaction: JSON.parse(body), isValid: true};
}

const server = {
    verifyDiscordRequest,
    fetch: router.fetch
};

export default server;