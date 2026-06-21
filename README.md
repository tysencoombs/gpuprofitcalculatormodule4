# GPU Profit Dashboard

## Overview
As I continue developing my software engineering skills, I wanted to learn how modern web applications handle user input, store information, and display dynamically generated content. To accomplish this, I created GPU profit dashboard using Node.js, Express, EJS, and SQLite. The application allows users to save information about GPUs, estimate mining profitability, and view calculated revenue, power costs, and profit projections. 

The application runs locally on a Node.js test server. To start the web app, open a terminal in the project folder and run:
npm install
npm start
Once the server is running, open a web browser and navigate to:
http://localhost:3000

The application will load the dashboard page where users can view profit stats and navigate throughout the site. 
The purpose of writing this software is to gain experience building a complete web application that combines server-side programming, database storage, dynamic web pages, and user interaction. I also wanted to create something related to a topic I am personally interested in and would use in the future to track GPU mining profitability and involved costs.

[YOUTUBE LINK](https://youtu.be/ESe_00P5cUQ)

## Web Pages
This application contains three primary web pages.
The Dashboard page serves as the main landing page. It displays dynamically generated statistics including the number of saved GPUs, daily revenue, power costs, daily profit, monthly profit, yearly profit, and other calculated values. All information on this page is generated from data stored in SQLite database.
The Add GPU page allows users to enter information about a GPU, including the GPU name, hash rate, power consumption, electricity cost, estimated Pearl earnings, and notes. When the form is submitted, the data is stored in the SQLite database and becomes available throughout the application. 
The Saved GPUs page displays all GPUs currently stored in the database. Each GPU entry includes calculated values such as daily revenue, daily power cost, daily profit, monthly profit, and yearly profit. Users can also delete entries from this page. The information displayed is generated dynamically from database records and updates automatically whenever GPUs are added or removed. 
Navigation links allow users to move between the Dashboard, Add GPU, and Saved GPUs pages.

## Development Environment
The software was developed using Visual Studio Code as the primary development environment. GitHub was used for project management. 
The application was written using JavaScript and runs on Node.js. Then express framework was used to handle routing and web server functionality. EJS was used to generate dynamic HTML pages, and SQLite was used to store user data locally. Standard HTML and CSS were used to create the user interface and page styling.

## Useful Websites
https://nodejs.org/en/docs
https://expressjs.com
https://ejs.co
https://www.sqlite.org/docs.html
https://developer.mozilla.org
https://www.coingecko.com

## Future Work and Additions
-	Add charts and graphs to visualize data.
-	Allow users to edit existing GPU entries instead of only adding and deleting them.
-	Add support for additional cryptocurrencies and mining algorithms.
-	Add GPU purchase price tracking and break-even calculations.
-	Improve the visual design and responsiveness of the dashboard. 
