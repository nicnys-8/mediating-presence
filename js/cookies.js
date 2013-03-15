/**
 Stores a cookie
 */
function setCookie ( name, value, exp_y, exp_m, exp_d, path, domain, secure )
{
    var cookie_string = name + "=" + escape ( value );
    if ( exp_y ) {
        var expires = new Date ( exp_y, exp_m, exp_d );
        cookie_string += "; expires=" + expires.toGMTString();
    }
    if (path) cookie_string += "; path=" + escape (path);
    if (domain) cookie_string += "; domain=" + escape (domain);
    if (secure) cookie_string += "; secure";
    
    document.cookie = cookie_string;
}


/**
 Retrieves the specified cookie value
 */
function getCookie (cookieName)
{
    var results = document.cookie.match ( '(^|;) ?' + cookieName + '=([^;]*)(;|$)' );
    if (results) {
        return (unescape(results[2]));
    }
    else {
        return null;
    }
}
