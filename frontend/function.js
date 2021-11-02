let gUrl = "https://m7exho74yc.execute-api.ap-northeast-2.amazonaws.com/Prod";

$(document).ready(function () {
    $.ajaxSetup({
        error: function (jqXHR, exception) {
            switch (jqXHR.status) {
                case 401:
                    alert('인증 에러!!');
                    break;
                case 423:
                    alert('중복된 id!!');
                    break;
            }
        },
        beforeSend: function (xhr) {
            if (localStorage.getItem('token') != null) {
                xhr.setRequestHeader('Authorization', localStorage.getItem('token'));
            } else {
                xhr.setRequestHeader('Authorization', 'anonymous');
            }
        }
    });
})

function openClose() {
    if ($("#post-box").css("display") == "block") {
        $("#post-box").hide();
        $("#btn-post-box").text("포스팅 박스 열기");
    } else {
        $("#post-url").val('');
        $("#post-comment").val('');
        $("#post-box").show();
        $("#btn-post-box").text("포스팅 박스 닫기");
    }
}

function openCloseLogin() {
    $('#login-id').val('');
    $('#login-pwd').val('');
    $('#loginModal').modal('show');
}

function login() {
    $.ajax({
        type: "POST",
        url: `${gUrl}/login`,
        data: JSON.stringify({id: $("#login-id").val(), pwd: $("#login-pwd").val()}),
        success: function (response) {
            localStorage.setItem('token', response['token']);
            alert("로그인 되었습니다!!");
            $('#loginModal').modal('hide');
            loginCheck();
        }
    })
}

function openCloseJoin() {
    $('#joinModal').modal('show');
}

function join() {
    $.ajax({
        type: "POST",
        url: `${gUrl}/join`,
        data: JSON.stringify({id: $("#join-id").val(), pwd: $("#join-pwd").val()}),
        success: function (response) {
            alert("로그인 해주세요!!");
            $('#joinModal').modal('hide');
        }
    })
}


function openClose() {
    if ($("#post-box").css("display") == "block") {
        $("#post-box").hide();
        $("#btn-post-box").text("포스팅 박스 열기");
    } else {
        $("#post-url").val('');
        $("#post-comment").val('');
        $("#post-box").show();
        $("#btn-post-box").text("포스팅 박스 닫기");
    }
}

function postingArticle() {
    let url = $("#post-url").val();
    let comment = $("#post-comment").val();
    let idx = $("#post-idx").val();

    if (idx != '') {
        $.ajax({
            type: "PUT",
            url: `${gUrl}/article`,
            data: {idx: idx, title: url, content: comment},
            success: function (response) {
                if (response["result"] == "success") {
                    alert("포스팅 업데이트 성공!");
                    window.location.reload();
                } else {
                    alert("서버 오류!");
                }
            }
        })
    } else {
        $.ajax({
            type: "POST",
            url: `${gUrl}/article`,
            data: JSON.stringify({title: url, content: comment}),
            success: function (response) {
                if (response["result"] == "success") {
                    alert("포스팅 성공!");
                    window.location.reload();
                } else {
                    alert("서버 오류!");
                }
            }
        })
    }
}

function showArticles(curPage) {
    let searchTitle = $("#searchTitle").val();
    $.ajax({
        type: "GET",
        url: `${gUrl}/articles/${listType}?perPage=${perPage}&curPage=${curPage}&order=${order}&searchTitle=${searchTitle}`,
        data: {},
        success: function (response) {
            $("#list-post").empty();
            let articles = response["articles"];
            let pagingInfo = response["pagingInfo"];
            for (let i = 0; i < articles.length; i++) {
                let num = response["pagingInfo"]["totalCount"] - (perPage * (curPage - 1)) - i
                makeListPost(articles[i], num);
            }
            makePaging(pagingInfo);
        }
    })
}

function makePaging(pagingInfo) {
    let tempHtml = '';
    for (let i = 0; i < pagingInfo['totalPage']; i++) {
        if (i + 1 == pagingInfo['curPage']) {
            tempHtml += `<li class="page-item active"><a class="page-link" href="#">${i + 1}</a></li>`;
        } else {
            tempHtml += `<li class="page-item"><a class="page-link" href="#" onclick="showArticles(${i + 1})">${i + 1}</a></li>`;
        }
    }
    $("#pagination").html(tempHtml);
}

function searching() {
    showArticles(1)
}

function getArticle(idx) {
    $.ajax({
        type: "GET",
        url: `/article?idx=${idx}`,
        data: {},
        success: function (response) {
            let title = response['article']['title']
            let content = response['article']['content']
            $("#post-url").val(title);
            $("#post-comment").val(content);
            $("#post-idx").val(idx);
            $("#post-box").show();
            $("#btn-post-box").text("포스팅 박스 닫기");
        }
    })
}

function readArticle(idx) {
    location.href = `detail.html?idx=${idx}`;
}

function makeListPost(post, index) {
    let tempHtml = ` <tr>
                      <th scope="row">${index}</th>
                      <td><a href="#" onclick="readArticle(${post['idx']})">${post['title']}</td>
                      <td>${post['writer'] ? post['writer'] : '비회원'}</td>
                      <td>${post['reg_date']}</td>
                      <td>${post['read_count']}</td>
<!--                      <td><button type="button" class="btn btn-danger" onclick="deleteArticle(${post['idx']})">삭제</button></td>-->
<!--                      <td><button type="button" class="btn btn-primary" onclick="getArticle(${post['idx']})">수정</button></td>-->
                      </tr>
                    `;
    $("#list-post").append(tempHtml);
}

function deleteArticle(idx) {
    $.ajax({
        type: "DELETE",
        url: `/article?idx=${idx}`,
        success: function (response) { // 성공하면
            if (response["result"] == "success") {
                alert("삭제 성공!");
                window.location.reload();
            } else {
                alert("서버 오류!");
            }
        }
    })
}

function setOrder() {
    if (order == "asc") {
        order = "desc";
        $("#viewOrder").html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-square-fill" viewBox="0 0 16 16">
  <path d="M2 16a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2zm6.5-4.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 1 0z"/>
</svg>`)
    } else {
        order = "asc";
        $("#viewOrder").html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-square-fill" viewBox="0 0 16 16">
  <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm6.5 4.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5a.5.5 0 0 1 1 0z"/>
</svg>`)
    }
    showArticles(1);
}

function openCloseLogin() {
    $('#login-id').val('');
    $('#login-pwd').val('');
    $('#loginModal').modal('show');
}

function login() {
    $.ajax({
        type: "POST",
        url: `${gUrl}/login`,
        data: JSON.stringify({id: $("#login-id").val(), pwd: $("#login-pwd").val()}),
        success: function (response) {
            localStorage.setItem('token', response['token']);
            alert("로그인 되었습니다!!");
            $('#loginModal').modal('hide');
            loginCheck();
        }
    })
}

function openCloseJoin() {
    $('#joinModal').modal('show');
}

function join() {
    $.ajax({
        type: "POST",
        url: `${gUrl}/join`,
        data: JSON.stringify({id: $("#join-id").val(), pwd: $("#join-pwd").val()}),
        success: function (response) {
            alert("로그인 해주세요!!");
            $('#joinModal').modal('hide');
        }
    })
}

function logout() {
    localStorage.removeItem('token');
    $('#btn-login').show();
    $('#btn-kakao').show();
    $('#btn-logout').hide();
    $('#btn-join').show();
}

function loginCheck() {
    if (localStorage.getItem('token')) {
        $('#btn-login').hide();
        $('#btn-kakao').hide();
        $('#btn-logout').show()
        $('#btn-join').hide();
    }
}

function setListType(type) {
    if (type == 'my' && !localStorage.getItem('token')) {
        alert("로그인 하세요!!");
        return false;
    }

    if (listType == type) return false;
    item = `#list-${type}`;
    $(item).closest("ul").find("li").each(function (index) {
        if ($(this).children("a").hasClass("active")) {
            $(this).children("a").removeClass("active");
            $(this).children("a").addClass("disabled");
        } else {
            $(this).children("a").addClass("active");
            $(this).children("a").removeClass("disabled");
        }
    });
    listType = type;
    showArticles(1);
}

function getArticle(idx) {
    $.ajax({
        type: "GET",
        url: `${gUrl}/article?idx=${idx}`,
        data: {},
        success: function (response) {
            let title = response['article']['title']
            let content = response['article']['content']
            $("#title").html(title);
            $("#content").html(content);
        }
    })
}

function getParam(name) {
    var results = new RegExp('[\?&amp;]' + name + '=([^&amp;#]*)').exec(window.location.href);
    return results[1] || 0;
}

// Kakao.init('8890a67c089173194979845f9389950d'); //발급받은 키 중 javascript키를 사용해준다.
// console.log(Kakao.isInitialized()); // sdk초기화여부판단
// //카카오로그인
// function kakaoLogin() {
//     Kakao.Auth.login({
//         success: function (response) {
//             Kakao.API.request({
//                 url: '/v2/user/me',
//                 success: function (response) {
//                     console.log(response)
//                 },
//                 fail: function (error) {
//                     console.log(error)
//                 },
//             })
//         },
//         fail: function (error) {
//             console.log(error)
//         },
//     })
// }