function transformWD(lng, lat) {
    var PI = 3.1415926535897932384626;
    var ret =
        -100.0 +
        2.0 * lng +
        3.0 * lat +
        0.2 * lat * lat +
        0.1 * lng * lat +
        0.2 * Math.sqrt(Math.abs(lng));
    ret +=
        ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
            2.0) /
        3.0;
    ret +=
        ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) *
            2.0) /
        3.0;
    ret +=
        ((160.0 * Math.sin((lat / 12.0) * PI) +
                320 * Math.sin((lat * PI) / 30.0)) *
            2.0) /
        3.0;
    return ret;
}

function transformJD(lng, lat) {
    var PI = 3.1415926535897932384626;
    var ret =
        300.0 +
        lng +
        2.0 * lat +
        0.1 * lng * lng +
        0.1 * lng * lat +
        0.1 * Math.sqrt(Math.abs(lng));
    ret +=
        ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
            2.0) /
        3.0;
    ret +=
        ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) *
            2.0) /
        3.0;
    ret +=
        ((150.0 * Math.sin((lng / 12.0) * PI) +
                300.0 * Math.sin((lng / 30.0) * PI)) *
            2.0) /
        3.0;
    return ret;
}

function wgs2gcj(arrdata) {
    var x_PI = (3.14159265358979324 * 3000.0) / 180.0;
    var PI = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;
    var lng = Number(arrdata[0]);
    var lat = Number(arrdata[1]);
    var dlat = transformWD(lng - 105.0, lat - 35.0);
    var dlng = transformJD(lng - 105.0, lat - 35.0);
    var radlat = (lat / 180.0) * PI;
    var magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
    dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
    var mglat = lat + dlat;
    var mglng = lng + dlng;

    mglng = Number(mglng.toFixed(6));
    mglat = Number(mglat.toFixed(6));
    return [mglng, mglat];
}

function gcj2wgs(arrdata) {
    var x_PI = (3.14159265358979324 * 3000.0) / 180.0;
    var PI = 3.1415926535897932384626;
    var a = 6378245.0;
    var ee = 0.00669342162296594323;
    var lng = Number(arrdata[0]);
    var lat = Number(arrdata[1]);
    var dlat = transformWD(lng - 105.0, lat - 35.0);
    var dlng = transformJD(lng - 105.0, lat - 35.0);
    var radlat = (lat / 180.0) * PI;
    var magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
    dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);

    var mglat = lat + dlat;
    var mglng = lng + dlng;

    var jd = lng * 2 - mglng;
    var wd = lat * 2 - mglat;

    jd = Number(jd.toFixed(6));
    wd = Number(wd.toFixed(6));
    return [jd, wd];
}

function cartesianToLnglat(cartesian, isToWgs84) {
    if (isToWgs84) {
        var lat = cartesian.latitude;
        var lng = cartesian.longitude;
        var hei = cartesian.height;
        console.log("1234555", cartesian, "9999", lat, lng, hei);
        return [lng, lat, hei];
    } else {
    }
}
// 经纬度转世界坐标 [101,40]
function lnglatToCartesian(lnglat) {
    if (!lnglat) return null;
    return Cesium.Cartesian3.fromDegrees(
        lnglat[0],
        lnglat[1],
        lnglat[2] || 0
    );
}

function lnglatArrToCartesianArr(lnglatArr) {
    if (!lnglatArr) return [];
    var arr = [];
    for (var i = 0; i < lnglatArr.length; i++) {
        arr.push(lnglatToCartesian(lnglatArr[i]));
    }
    return arr;
}

export {
    transformWD,
    transformJD,
    wgs2gcj,
    gcj2wgs,
    cartesianToLnglat,
    lnglatToCartesian,
    lnglatArrToCartesianArr
}
