const amqp = require("amqplib");
const mysql = require("mysql");
const moment = require('moment');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_SCHEMA,
});

connection.connect();

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

async function receiveOrders() {
  
  const conn = await amqp.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}`);
  const channel = await conn.createChannel();

  const queue = "orders-new";
  await channel.assertQueue(queue, { durable: true });

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

  channel.prefetch(1);

  channel.consume(queue, async (msg) => {
    try {
      let order = JSON.parse(msg.content.toString());
      const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
      order.rabbit_mq_stamp = timestamp;
      console.log(" [x] Received %s", order);

      await sleep(10000);

      const sql = "INSERT INTO orders SET ?";
      connection.query(sql, order, (error, results) => {
        if (error) throw error;
        console.log("Order saved to database with id: " + results.insertId);
        channel.ack(msg);
      });
    } catch (error) {
      console.log("Error:", error.message);
    }
  });
}

receiveOrders();