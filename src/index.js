import nacl from 'tweetnacl';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // 1. Verify Request Signature from Discord
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');
    const body = await request.text();

    const isVerified = nacl.sign.detached.verify(
      new TextEncoder().encode(timestamp + body),
      // Hex to Uint8Array helper
      Uint8Array.from(Buffer.from(signature || '', 'hex')),
      Uint8Array.from(Buffer.from(env.DISCORD_PUBLIC_KEY, 'hex'))
    );

    if (!isVerified) {
      return new Response('Invalid request signature', { status: 401 });
    }

    // 2. Parse Interaction
    const interaction = JSON.parse(body);

    // Handle Discord PING (Type 1) to keep connection alive
    if (interaction.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle Slash Commands (Type 2)
    if (interaction.type === 2) {
      if (interaction.data.name === 'ping') {
        return new Response(
          JSON.stringify({
            type: 4, // Respond immediately
            data: { content: 'Pong from Cloudflare Workers!' },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response('Unknown interaction', { status: 400 });
  },
};