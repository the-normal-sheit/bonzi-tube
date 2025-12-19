var serverUrl = "https://england-mouse-fabrics-statutory.trycloudflare.com";
let socket = io(serverUrl);

function $(a){return document.getElementById(a);}
let myUsername = getCookie("username") || "";
let currentVideoId = "";

function setCookie(name, value, days = 30) {
    let expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

function getCookie(name) {
    var value = document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
    return value ? decodeURIComponent(value) : undefined;
}

if (myUsername) {
    document.getElementById("usernameInput").value = myUsername;
}

$("saveButton").addEventListener("click", ()=> {
    let username = document.getElementById("usernameInput").value;
    setCookie("username", username);
    myUsername = username;
    alert("Username saved for next video.");
});

function id(len){
    let result = "";
    for(let i=0;i<len;i++){
        result+="abcdefghijklmn123456789".charAt(Math.floor(Math.random() * 21));
    }
    return result;
}

var Page = {
    switchSrc:(newHTML)=>{
        $("content").innerHTML = "";
        $('content').style.left='0px';
        $("content").insertAdjacentHTML('beforeend',`
            ${newHTML.replaceAll("placeid=","id=")}
        `);
    },
    video:(newVideo)=>{
        let localId = id(5);
        currentVideoId = newVideo["id"];
    
        Page.switchSrc(`
            <button id="${localId}admin" style="position:absolute;display:none;top:0px;right:0px;">🔨</button>
            <video controls width="300">
                <source src="${newVideo["src"]}" type="video/mp4" />
            </video>
			<br>
			<p>Average rating: <span id="${localId}avgrating">${newVideo["stars"].toFixed(1)}</span>/5</p><br>
			<div style="display:flex;">
			<p>Rate video || 
			</p>
			<div id="${localId}rate1" class="starred"></div>
			<div id="${localId}rate2" class="starred"></div>
			<div id="${localId}rate3" class="starred"></div>
			<div id="${localId}rate4" class="starred"></div>
			<div id="${localId}rate5" class="starred"></div>
			</div>
            <br>
            <button id="${localId}">Share 🔗</button>
            <button id="${localId}delete">🗑️</button>
            <br>
            <div id="${localId}url" style="visibility:hidden;">
            <input style="width:200px;" id="${localId}val" type="text" disabled>
            <button id="${localId}copy">Copy Link 📃</button>
            </div>
            <hr>
            <p style="color:black;background-color:white;border-radius:5px;padding:5px;max-width:400px;">
            <span style="font-size:20px;">${newVideo["title"]}</span><br>
            <span style="font-size:14px;color:gray;text-shadow:1px 1px 1px rgba(0,0,0,0.3);">
            Author: ${newVideo["author"]}
            </span><br>
            <span style="font-size:14px;color:gray;text-shadow:1px 1px 1px rgba(0,0,0,0.3);">
            Views: ${newVideo["views"]}
            <br>
            <span style="font-size:14px;color:gray;text-shadow:1px 1px 1px rgba(0,0,0,0.3);">
            Upload date: ${newVideo["timestamp"] == "Unknown" ? "Before time stamp update" : newVideo["timestamp"]}
            </span>
            </p>
            <hr>
            <div style="max-width:400px;">
            <h3>Comments</h3>
            <div id="${localId}comments" style="max-height:300px;overflow-y:auto;background-color:white;padding:10px;border-radius:5px;">
            </div>
            <br>
            <textarea id="${localId}commenttext" placeholder="Write a comment..." style="width:100%;height:60px;"></textarea>
            <br>
            <button id="${localId}postcomment">Post Comment</button>
            </div>
        `);
        
        socket.emit("getComments",{videoId:newVideo["id"]});
        
        setTimeout(() => {
			for(let i=1;i<6;i++){
				$(localId+"rate"+i.toString()).onclick = () => {
                    socket.emit("rate",{id:newVideo["id"],rating:i});
                }
			}
            $(localId+"val").value = "https://bonzitube.rf.gd/?video="+newVideo["id"].replace("#","");
            $(localId).onclick =()=>{ $(localId+"url").style.visibility="visible";}
            $(localId+"copy").onclick =()=>{
                let copiz = $(localId+"val");
                copiz.select();
                let cc = copiz.value;
                if(cc.includes("?video="))cc = cc.substring(0,cc.indexOf("?video="))+ "?video="+newVideo["id"].replace("#","");
                copiz.setSelectionRange(0, 99999);
                navigator.clipboard.writeText(cc);
                alert("URL copied!");
            }
            $(localId+"delete").onclick = () => {
                let pass = prompt("Admin password for video deletion?") || "none";
                socket.emit("delete",{id:newVideo["id"],password:pass});
            }
            $(localId+"postcomment").onclick = () => {
                let commentText = $(localId+"commenttext").value;
                if(commentText.trim() === ""){
                    alert("Comment cannot be empty");
                    return;
                }
                socket.emit("postComment",{
                    videoId:newVideo["id"],
                    author:myUsername || "Anonymous",
                    text:commentText
                });
                $(localId+"commenttext").value = "";
            }
        },100);
    },
}

socket.on("comments",data=>{
    if(data.videoId !== currentVideoId)return;
    
    let commentsContainer = document.querySelector('[id$="comments"]');
    if(!commentsContainer)return;
    
    commentsContainer.innerHTML = "";
    
    if(data.comments.length === 0){
        commentsContainer.innerHTML = "<p style='color:gray;'>No comments yet. Be the first to comment!</p>";
        return;
    }
    
    data.comments.forEach(comment => {
        let likesCount = comment.likes ? comment.likes.length : 0;
        let dislikesCount = comment.dislikes ? comment.dislikes.length : 0;
        
        commentsContainer.insertAdjacentHTML('beforeend',`
            <div style="border-bottom:1px solid #ddd;padding:10px;margin-bottom:10px;">
                <p style="margin:0;"><strong>${comment.author}</strong> <span style="color:gray;font-size:12px;">${comment.timestamp}</span></p>
                <p style="margin:5px 0 0 0;color:#333;">${comment.text}</p>
                <div style="margin-top:5px;display:flex;gap:10px;align-items:center;">
                    <button onclick="likeComment('${data.videoId}', '${comment.id}', 'like')" style="font-size:12px;padding:3px 8px;cursor:pointer;">👍 ${likesCount}</button>
                    <button onclick="likeComment('${data.videoId}', '${comment.id}', 'dislike')" style="font-size:12px;padding:3px 8px;cursor:pointer;">👎 ${dislikesCount}</button>
                    <button onclick="deleteComment('${data.videoId}', '${comment.id}')" style="font-size:10px;padding:2px 5px;">🗑️ Delete</button>
                </div>
            </div>
        `);
    });
});

function likeComment(videoId, commentId, type){
    socket.emit("likeComment",{videoId:videoId, commentId:commentId, type:type});
}

function deleteComment(videoId, commentId){
    let pass = prompt("Admin password to delete comment?") || "none";
    socket.emit("deleteComment",{videoId:videoId, commentId:commentId, password:pass});
}

socket.on("commentPosted",data=>{
    if(data.success){
        socket.emit("getComments",{videoId:currentVideoId});
    }
});

socket.on("ratingUpdated",data=>{
    let ratingDisplay = document.querySelector('[id$="avgrating"]');
    if(ratingDisplay){
        ratingDisplay.textContent = data.rating.toFixed(1);
    }
});

socket.on("alert",data=>{alert(data);});

socket.on("home",data=>{
    console.log(data);
     $("content").innerHTML = "";
    Page.switchSrc($("trending").innerHTML);
     $("content").innerHTML = $("content").innerHTML.replaceAll("<h1>Loading...</h1>","");
    let queue = 0;
    let row = 1;
    data.most.forEach(video => {
        queue++;
        let localId = video["id"].substring(1,video["id"].length); 
        if(queue > 2){queue = 1; row++;}
        if($('trending_'+row) == null){
            $("content").insertAdjacentHTML('beforeend',`
                <div class="menu thumbs videofront" id="trending_${row}">
                <div class="thumbnail" id="${localId}">
                    <img class="thumbcont" src="${video["thumbnail"]}" width="100" height="56">
                    <p style="max-width:100%;">
                    <span class="title">${video["title"]}</span>
                    <br>
                    <span class="author">${video["author"]}</span>
                    <br>
                    <span class="author">Views: ${video["views"]}</span>
                    <br>
                    <span class="author">⭐ ${video["stars"].toFixed(1)}</span>
                    </p>
                </div>
                </div>
            `);
             setTimeout(() => {$(localId).onclick = () => {Page.video(video);socket.emit("goto",video["id"]);}},100);
        } else {
        
            $('trending_'+row).insertAdjacentHTML('beforeend',`
                <div class="thumbnail" id="${localId}">
                    <img class="thumbcont" src="${video["thumbnail"]}" width="100" height="56">
                    <p style="max-width:100%;">
                    <span class="title">${video["title"]}</span>
                    <br>
                    <span class="author">${video["author"]}</span>
                    <br>
                    <span class="author">Views: ${video["views"]}</span>
                    <br>
                    <span class="author">⭐ ${video["stars"].toFixed(1)}</span>
                    </p>
                </div>
            `);
             setTimeout(() => {$(localId).onclick = () => {Page.video(video);socket.emit("goto",video["id"]);}},100);
        }
    });
    data.new = data.new.slice(0,10);
    data.new.forEach(video => {
        queue++;
        let localId = video["id"].substring(1,video["id"].length) + '_2'; 
        if(queue > 2){queue = 1; row++;}
        if($('newest_'+row) == null){
            $("newer").insertAdjacentHTML('beforeend',`
                <div class="menu thumbs" id="newest_${row}">
                <div class="thumbnail" id="${localId}">
                    <img class="thumbcont" src="${video["thumbnail"]}" width="100" height="56">
                    <p style="max-width:100%;">
                    <span class="title">${video["title"]}</span>
                    <br>
                    <span class="author">${video["author"]}</span>
                    <br>
                    <span class="author">Views: ${video["views"]}</span>
                    <br>
                    <span class="author">⭐ ${video["stars"].toFixed(1)}</span>
                    </p>
                </div>
                </div>
            `);
             setTimeout(() => {$(localId).onclick = () => {Page.video(video);socket.emit("goto",video["id"]);}},100);
        } else {
        
            $('newest_'+row).insertAdjacentHTML('beforeend',`
                <div class="thumbnail" id="${localId}">
                    <img class="thumbcont" src="${video["thumbnail"]}" width="100" height="56">
                    <p style="max-width:100%;">
                    <span class="title">${video["title"]}</span>
                    <br>
                    <span class="author">${video["author"]}</span>
                    <br>
                    <span class="author">Views: ${video["views"]}</span>
                    <br>
                    <span class="author">⭐ ${video["stars"].toFixed(1)}</span>
                    </p>
                </div>
            `);
             setTimeout(() => {$(localId).onclick = () => {Page.video(video);socket.emit("goto",video["id"]);}},100);
        }
    });
});

if(window.innerWidth < 800){
    
} else {
    $("left").style.display = 'none';
    $("right").style.display = 'none';
}

socket.on("err",data=>alert("ERROR: "+data));

socket.on("uploadsucceed",data=>{
    alert("Upload success!");
    socket.emit("home",{user:"Anonymous"});
});

function sharedUrlCheck(){
    if(location.href.includes("?video="))location.href=location.href.substring(
        0,
        location.href.indexOf("?video=")
    );
}

$("gethome").onclick = () => {
    sharedUrlCheck();
    socket.emit("home",{user:"Anonymous"});
}

$("getupload").onclick = () => {
    sharedUrlCheck();
    Page.switchSrc($("createvideo").innerHTML);
    setTimeout(() => {
        $("uploadvideo").onclick = () => {
            socket.emit("upload",{
                title:$("newtitle").value,
                author:$("newauthor").value,
                src:$("newvideo").value.trim(" "),
                thumbnail:$("newthumbnail").value.trim(" ")
            });
        }
        $("newauthor").value=myUsername;
    },1000);
}

Page.switchSrc($("trending").innerHTML);
socket.emit("home",{user:"Anonymous"});

if(location.href.includes('?video=')){
    setTimeout(() => {
        mainUrl = serverUrl+"/video?id="+location.href.substring(location.href.indexOf('?video=')+7,location.href.length);
console.log(mainUrl);
    fetch(mainUrl)
    .then(response =>{ console.log(response); return response.json()})
    .then(data => {
        Page.video(data);
        socket.emit("goto",data["id"]);
    });
    },1000);
}