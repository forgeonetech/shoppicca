// app/api/send-sms/route.js
// This is a Next.js API route handler

export async function POST(request:any) {
  try {
    const body = await request.json();
    const { smsMessage } = body;

    // Get API key from environment variables
    const apiKey = process.env.ARKESEL_API_KEY;
    
    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Arkesel API endpoint
    const arkeselUrl = 'https://sms.arkesel.com/api/v2/sms/send';
    
    // Your phone number to receive the SMS (without the + sign)
    const recipientNumber = '233249497164';

    // Prepare the request body for Arkesel
    const arkeselPayload = {
      sender: 'ForgeOne', // Sender ID (max 11 characters)
      message: smsMessage,
      recipients: [recipientNumber]
    };

    console.log('Sending SMS to Arkesel API...');

    // Make request to Arkesel API
    const response = await fetch(arkeselUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(arkeselPayload)
    });

    const data = await response.json();

    console.log('Arkesel API response:', data);

    // Check if the response indicates success
    // Arkesel returns { status: 'success', data: [...], main_balance: ..., sms_balance: ... }
    if (response.ok && data.status === 'success') {
      return Response.json(
        { 
          success: true, 
          message: 'Message sent successfully! We will get back to you soon.',
          arkeselResponse: {
            status: data.status,
            messageIds: data.data?.map(item => item.id) || [],
            smsBalance: data.sms_balance,
            mainBalance: data.main_balance
          }
        },
        { status: 200 }
      );
    } else {
      // Log the full error response for debugging
      console.error('Arkesel API error response:', data);
      
      return Response.json(
        { 
          error: 'Failed to send message', 
          details: data.message || data.status || 'Unknown error',
          arkeselResponse: data
        },
        { status: response.status || 500 }
      );
    }

  } catch (error) {
    console.error('Error in send-sms API route:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}