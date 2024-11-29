export default function dxfToSvg(dxfString) {
    "use strict";

    function format(str, ...args) {
        return str.replace(/{(\d+)}/g, (match, number) => {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    }

    function interpolate(t, degree, controlPoints, knots) {
        const n = controlPoints.length - 1;
        let result = [0, 0];
    
        for (let i = 0; i <= n; i++) {
            const basis = basisFunction(i, degree, t, knots);
            result[0] += basis * controlPoints[i][0];
            result[1] += basis * controlPoints[i][1];
        }
    
        return result;
    }
    
    function basisFunction(i, degree, t, knots) {
        if (degree === 0) {
            return (knots[i] <= t && t < knots[i + 1]) ? 1 : 0;
        } else {
            let coeff1 = (knots[i + degree] === knots[i]) ? 0 : (t - knots[i]) / (knots[i + degree] - knots[i]) * basisFunction(i, degree - 1, t, knots);
            let coeff2 = (knots[i + degree + 1] === knots[i + 1]) ? 0 : (knots[i + degree + 1] - t) / (knots[i + degree + 1] - knots[i + 1]) * basisFunction(i + 1, degree - 1, t, knots);
            return coeff1 + coeff2;
        }
    }

    function dxfObjectToSvgSnippet(dxfObject) {
        function getLineSvg(x1, y1, x2, y2) {
            return format('<path d="M{0},{1} {2},{3}"/>\n', x1, y1, x2, y2);
        }

        function deg2rad(deg) {
            return deg * (Math.PI/180);
        }

        switch (dxfObject.type) {
            case 'LINE':
                return getLineSvg(dxfObject.x, dxfObject.y, dxfObject.x1, dxfObject.y1);
            case 'CIRCLE':
                return format('<circle cx="{0}" cy="{1}" r="{2}"/>\n', dxfObject.x, dxfObject.y, dxfObject.r);
            case 'ARC':
                var x1 = dxfObject.x + dxfObject.r * Math.cos(deg2rad(dxfObject.a0));
                var y1 = dxfObject.y + dxfObject.r * Math.sin(deg2rad(dxfObject.a0));
                var x2 = dxfObject.x + dxfObject.r * Math.cos(deg2rad(dxfObject.a1));
                var y2 = dxfObject.y + dxfObject.r * Math.sin(deg2rad(dxfObject.a1));

                if (dxfObject.a1 < dxfObject.a0) {
                    dxfObject.a1 += 360;
                }
                var largeArcFlag = dxfObject.a1 - dxfObject.a0 > 180 ? 1 : 0;

                return format('<path d="M{0},{1} A{2},{3} 0 {4},1 {5},{6}"/>\n',
                        x1, y1, dxfObject.r, dxfObject.r, largeArcFlag, x2, y2);
            case 'LWPOLYLINE':
                var svgSnippet = '';
                var vertices = dxfObject.vertices;
                for (var i = 0; i < vertices.length - 1; i++) {
                    var vertice1 = vertices[i];
                    var vertice2 = vertices[i+1];
                    svgSnippet += getLineSvg(vertice1.x, vertice1.y, vertice2.x, vertice2.y);
                }
                return svgSnippet;
            case 'SPLINE':
                var svgSnippet = '';
                var controlPoints = dxfObject.vertices.map(function (value) {return [value.x, value.y]});
                var knots = dxfObject.knots;
                var degree = dxfObject.degree;
                var vertices = [];
                for (var t = 0; t <= 100; t++) {
                  vertices.push(interpolate(t/100, degree, controlPoints, knots));
                }
                for (var i = 0; i < vertices.length - 1; i++) {
                  var vertice1 = vertices[i];
                  var vertice2 = vertices[i+1];
                  svgSnippet += getLineSvg(vertice1[0], vertice1[1], vertice2[0], vertice2[1]);
                }
                return svgSnippet;
        }
    }

    var groupCodes = {
        0: 'entityType',
        2: 'blockName',
        10: 'x',
        11: 'x1',
        20: 'y',
        21: 'y1',
        40: 'r',
        50: 'a0',
        51: 'a1',
        71: 'degree',
        72: 'numOfKnots',
        73: 'numOfControlPoints',
        74: 'numOfFitPoints',
    };

    var supportedEntities = [
        'LINE',
        'CIRCLE',
        'ARC',
        'LWPOLYLINE',
        'SPLINE'
    ];

    var counter = 0;
    var code = null;
    var isEntitiesSectionActive = false;
    var object = {};
    var svg = '';

    // Normalize platform-specific newlines.
    dxfString = dxfString.replace(/\r\n/g, '\n');
    dxfString = dxfString.replace(/\r/g, '\n');

    dxfString.split('\n').forEach(function(line) {
        line = line.trim();

        if (counter++ % 2 === 0) {
            code = parseInt(line);
        } else {
            var value = line;
            var groupCode = groupCodes[code];
            if (groupCode === 'blockName' && value === 'ENTITIES') {
                isEntitiesSectionActive = true;
            } else if (isEntitiesSectionActive) {
                if (groupCode === 'entityType') {  // New entity starts.
                    if (object.type) {
                        svg += dxfObjectToSvgSnippet(object);
                    }

                    object = supportedEntities.includes(value) ? {type: value} : {};

                    if (value === 'ENDSEC') {
                        isEntitiesSectionActive = false;
                    }
                } else if (object.type && typeof groupCode !== 'undefined') {  // Known entity property recognized.
                    object[groupCode] = parseFloat(value);
                    if (object.type == 'SPLINE' && groupCode === 'r') {
                      if (!object.knots) {
                        object.knots = [];
                      }
                      object.knots.push(object.r);
                    }
                    if ((object.type == 'LWPOLYLINE' || object.type == 'SPLINE') && groupCode === 'y') {
                        if (!object.vertices) {
                            object.vertices = [];
                        }
                        object.vertices.push({x:object.x, y:object.y});
                    }
                }
            }
        }
    });

    if (svg === '') {
        return null;
    }

    var strokeWidth = 0.2;
    var pixelToMillimeterConversionRatio = 3.543299873306695;
    var svgId = "svg" + Math.round(Math.random() * Math.pow(10, 17));
    svg = format('<svg {0} version="1.1" xmlns="http://www.w3.org/2000/svg">\n' +
          '<g transform="scale({1},-{1})" ' +
            'style="stroke:black; stroke-width:{2}; ' +
                    'stroke-linecap:round; stroke-linejoin:round; fill:none">\n' +
          '{3}</g>\n' +
          '</svg>\n', 
          '', pixelToMillimeterConversionRatio, strokeWidth, svg);

    // The SVG has to be added to the DOM to be able to retrieve its bounding box.
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = format(svg, 'id="'+svgId+'"');
    document.body.appendChild(tempDiv);
    var boundingBox = tempDiv.querySelector('svg').getBBox();
    var viewBoxValue = format('{0} {1} {2} {3}', boundingBox.x-strokeWidth/2, boundingBox.y-strokeWidth/2,
                              boundingBox.width+strokeWidth, boundingBox.height+strokeWidth);
    document.body.removeChild(tempDiv);

    return format(svg, 'viewBox="' + viewBoxValue + '"');
}