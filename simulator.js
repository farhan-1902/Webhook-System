import * as readline from 'readline';

const webhook = {
    url: "http://localhost:4214/webhook",
    events: ["payment.accepted", "payment.failed"]
}

async function registerWebhook(webhook) {
    const response = await fetch('http://localhost:3000/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhook),
    });
    const result = await response.json();
    console.log('\nWebhook registered successfully:');
    console.log(`  ID     : ${result.id}`);
    console.log(`  API Key: ${result.apiKey}`);
    console.log(`  Secret : ${result.secret}`);
    return result;
}

async function sendEvent(event) {
    const response = await fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': event.apiKey,  // move it to the header
        },
        body: JSON.stringify({
            type: event.type,
            data: event.data,
        }),
    });
    const result = await response.json();
    console.log('\nEvent sent:', result);
}

async function waitForInput(message) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(message, () => {
            rl.close();
            resolve();
        });
    });
}

async function run() {
    // Step 1: Register webhook
    console.log('--- Step 1: Registering webhook ---');
    const registered = await registerWebhook(webhook);

    // // Step 2: Pause so you can update the consumer
    console.log('\n--- Step 2: Action required ---');
    console.log(`Copy this secret into WEBHOOK_SECRET in your consumer's index.ts:`);
    console.log(`\n  ${registered.secret}\n`);
    console.log('Then restart your consumer server.');
    await waitForInput('Press ENTER when ready to fire the event...');

    // Step 3: Fire event with apiKey attached
    console.log('\n--- Step 3: Firing event ---');
    const event = {
        type: "payment.failed",
        data: { amount: 1000, currency: "USD" },
        apiKey: "API_f7ca8380-19ee-4ecc-af0a-75882dd6b5d2",
    };
    await sendEvent(event);
}

run();