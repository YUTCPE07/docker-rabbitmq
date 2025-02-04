const amqp = require("amqplib");
const { v4: uuidv4 } = require("uuid");
const moment = require('moment');
require('dotenv').config();

async function sendOrder(order) {
    const connection = await amqp.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}`);
    const channel = await connection.createChannel();

    const queue = "orders-new";

    // เขียนลง disk เอาไว้ กรณีที่ queue ดับ
    await channel.assertQueue(queue, { durable: true });

    // ใส่ persistent + durable จะได้ข้อมูล queue เดิมออกมาได้
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(order)), { persistent: true });

    console.log(" [x] Sent %s", order);

    setTimeout(() => {
        connection.close();
        process.exit(0);
    }, 500);
}
const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
const order = {
  orderNumber: uuidv4(),
  price_id: "price_xxx",
  cus_id: "cus_xxx",
  date_charge: "2025-06-15 00:00:00",
  rabbit_mq_stamp: null,
  timestamp: timestamp,
};

sendOrder(order);