/**
 Stores a cookie
 */
function setCookie (name, value, expires, path, domain, secure) {
    var cookieString = name + "=" + escape ( value );
    if (expires) {
        cookieString += "; expires=" + expires.toGMTString();
    }
    if (path) cookieString += "; path=" + escape (path);
    if (domain) cookieString += "; domain=" + escape (domain);
    if (secure) cookieString += "; secure";
    
    document.cookie = cookieString;
}


/**
 Retrieves the specified cookie value
 */
function getCookie (cookieName) {
    var results = document.cookie.match ( '(^|;) ?' + cookieName + '=([^;]*)(;|$)' );
    if (results) {
        return (unescape(results[2]));
    }
    else {
        return null;
    }
}


/**
 Stores a cookie

function setCookie ( name, value, exp_y, exp_m, exp_d, path, domain, secure )
{
    var cookieString = name + "=" + escape ( value );
    if ( exp_y ) {
        var expires = new Date(exp_y, exp_m, exp_d);
        cookieString += "; expires=" + expires.toGMTString();
    }
    if (path) cookieString += "; path=" + escape (path);
    if (domain) cookieString += "; domain=" + escape (domain);
    if (secure) cookieString += "; secure";
    
    document.cookie = cookieString;
}
*/