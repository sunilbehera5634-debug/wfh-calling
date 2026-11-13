import crypto from 'crypto';

const trackedLeadEvents = new Set<string>();

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { registrationId, name, phone, email, eventName = 'Lead' } = body;

    if (!registrationId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Registration ID required' })
      };
    }

    const eventId = `${eventName.toLowerCase()}_${registrationId}`;

    if (trackedLeadEvents.has(eventId)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Duplicate Lead event prevented', event_id: eventId })
      };
    }

    trackedLeadEvents.add(eventId);

    const PIXEL_ID = '1794291811835142';
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || '';

    const rawIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
    const userIp = rawIp.split(',')[0].trim();
    const userAgent = event.headers['user-agent'] || '';

    const hash = (data: string) => data ? crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex') : undefined;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          user_data: {
            ph: phone ? [hash(phone.replace(/\D/g, ''))] : undefined,
            em: email ? [hash(email)] : undefined,
            fn: name ? [hash(name.split(' ')[0])] : undefined,
            client_ip_address: userIp,
            client_user_agent: userAgent
          },
          custom_data: {
            content_name: 'WFH Hindi Calling Masterclass Free Registration',
            status: 'confirmed'
          }
        }
      ]
    };

    if (META_ACCESS_TOKEN) {
      const response = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, event_id: eventId, capi_result: result })
      };
    } else {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, event_id: eventId, notice: 'Server Lead event processed (Token pending in env)' })
      };
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
}
