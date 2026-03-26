export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Updated CORS headers based on your configuration
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, POST, HEAD, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Expose-Headers": "ETag, x-amz-version-id",
      "Access-Control-Max-Age": "3000",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const authKey = request.headers.get("Authorization");
    
    // Security Check
    if (authKey !== "123456@") return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    // Handle Image Upload
    if (request.method === "POST" || request.method === "PUT") {
      const fileName = url.searchParams.get("file");
      if (!fileName) return new Response("Missing filename", { status: 400, headers: corsHeaders });
      
      await env.fuadcards.put(fileName, request.body);
      return new Response("Uploaded", { headers: corsHeaders });
    }

    // Handle Image Deletion
    if (request.method === "DELETE") {
      const fileName = url.searchParams.get("file");
      if (!fileName) return new Response("Missing filename", { status: 400, headers: corsHeaders });
      
      await env.fuadcards.delete(fileName);
      return new Response("Deleted", { headers: corsHeaders });
    }
    
    // Serve Image
    if (request.method === "GET" || request.method === "HEAD") {
      const object = await env.fuadcards.get(url.pathname.slice(1));
      if (!object) return new Response("Not Found", { status: 404, headers: corsHeaders });
      
      const headers = new Headers(corsHeaders);
      object.writeHttpMetadata(headers);
      headers.set("ETag", object.httpEtag);
      
      return new Response(object.body, { headers });
    }

    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }
}
