const http = require("http");
const fs = require("fs");
const url = require("url");

// Path to the JSON file for storing blog posts
const filePath = "./post.json";

// Load initial data from the JSON file
let posts = [];
try {
  const rawData = fs.readFileSync(filePath);
  posts = JSON.parse(rawData);
} catch (error) {
  console.error("Error loading initial data:", error);
}

// Function to handle incoming requests
function requestHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  switch (req.method) {
    case "GET":
      if (path === "/blog/posts") {
        getAllPosts(res);
      } else if (path.startsWith("/blog/post/")) {
        getPostById(res, parsedUrl.query.id);
      }
      break;
    case "POST":
      if (path === "/blog/post") {
        createPost(req, res);
      }
      break;
    case "PUT":
    case "PATCH":
      if (path.startsWith("/blog/post/")) {
        updatePost(res, parsedUrl.query.id, req.body);
      }
      break;
    case "DELETE":
      if (path.startsWith("/blog/post/")) {
        deletePost(res, parsedUrl.query.id);
      }
      break;
    default:
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end();
  }
}

// Helper functions for CRUD operations
function getAllPosts(res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(posts));
}

function getPostById(res, id) {
  const post = posts.find((post) => post.id === Number(id));
  if (!post) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end();
  } else {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(post));
  }
}

function createPost(req, res) {
    let bodyChunks = []; // Array to hold chunks of data
    req.on('data', chunk => {
      bodyChunks.push(chunk); // Push each chunk into the array
    });
  
    req.on('end', () => {
      const body = Buffer.concat(bodyChunks).toString(); // Join chunks into a string
      console.log(body);
    //   console.table(body);
  
      // At this point, `body` has the entire request body stored in it as a string
      const post = JSON.parse(body);
      post.id = Date.now(); // Simple ID generation
      posts.push(post);
      
      fs.writeFile(filePath, JSON.stringify(posts), err => {
        if (err) {
          console.error(err); // Log the error instead of throwing it
          res.status(500).send({ error: 'Failed to save post.' }); // Send a response indicating failure
        } else {
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(post)); // Respond with the created post
        }
      });
    });
}
  
function updatePost(res, id, body) {
  const postIndex = posts.findIndex((post) => post.id === Number(id));
  if (postIndex === -1) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end();
  } else {
    const updatedPost = JSON.parse(body);
    posts[postIndex] = { ...posts[postIndex], ...updatedPost };
    fs.writeFile(filePath, JSON.stringify(posts), (err) => {
      if (err) throw err;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updatedPost));
    });
  }
}

function deletePost(res, id) {
    const postIndex = posts.findIndex((post) => post.id === Number(id));
    if (postIndex === -1) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Post not found" }));
      console.log("Post not found");
    } else {
      posts.splice(postIndex, 1);
      fs.writeFile(filePath, JSON.stringify(posts), (err) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Internal server error" }));
          console.error("Error deleting post:", err);
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Post deleted successfully" }));
          console.log("Post deleted");
        }
      });
    }
  }
  
  

// Create the server
const server = http.createServer(requestHandler);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
