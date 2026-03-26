# 🌐 Mini CDN Simulation

A Content Delivery Network (CDN) simulation project built for Computer Networks. It demonstrates how client requests are routed through a CDN controller to multiple edge servers based on latency and caching.

---

## 🧠 Overview

This project simulates how a real-world CDN works by:
- Distributing requests across multiple edge servers  
- Reducing latency using nearest server selection  
- Implementing basic caching (cache hit / miss)  
- Comparing performance with and without CDN  

---

## 🏗️ Architecture
## ✨ Features

- Multiple edge server simulation  
- CDN controller with routing logic  
- Latency-based request handling  
- Cache hit and cache miss simulation  
- Origin server fallback  
- Performance comparison  

---

## 🛠️ Tech Stack

- Node.js  
- Express.js  
- JavaScript  

---

## 📁 Project Structure

cdn-simulator/
│── controller/
│── edge-servers/
│── origin-server/
│── client/
│── package.json
│── server.js

---

## ▶️ How to Run

1. Install dependencies:
npm install

2. Start Origin Server:
node origin-server.js

3. Start Edge Servers:
node edge1.js  
node edge2.js  
node edge3.js  

4. Start CDN Controller:
node controller.js

5. Run Client Request:
Open browser or use:
http://localhost:3000/content

---

## ⚙️ How It Works

1. Client sends request to CDN Controller  
2. Controller selects best edge server based on latency  
3. If data exists in cache → Cache Hit  
4. If not → fetch from Origin Server (Cache Miss)  
5. Edge server stores data and responds to client  

---

## 🎯 Project Objective

This project was built to:
- Understand CDN architecture  
- Learn request routing and caching  
- Simulate real-world network behavior  
- Apply computer networks concepts practically  

---

## 🌱 Future Enhancements

- Geo-based routing  
- Cache expiration (TTL)  
- Load balancing algorithms  
- Real-time latency visualization  
- GUI dashboard  

---

## 📄 License

This project is open-source and intended for educational use.
