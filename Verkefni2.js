/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir notkun stigveldislíkana.  Forritið robotArm er
//     úr kennslubókinni en nú er hægt að snúa líkaninu með mús.
//
//    Hjálmtýr Hafsteinsson, febrúar 2022
/////////////////////////////////////////////////////////////////
var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var NumKindur = 0;

var NumUlfar = 0;

var teljari = 0;

// Fylki sem heldur utan um hvaða kassar á leikborðinu eru teiknaðir
const leikur = new Array(10).fill(0).map(() => new Array(10).fill(0).map(() => new Array(10).fill(0))); // Búum til leikborðið

// Búum til dataType fyrir dýrin okkar
class kind {
    constructor(stadsetning) {
        this.stadsetning = stadsetning;
    }
    tala = 1;
    Faedingateljari = 0;
    increment() {
        this.Faedingateljari += 1;
    }
}
class ulfur {
    constructor(stadsetning) {
        this.stadsetning = stadsetning;
    }
    tala = 2;
}

// Búum til tvö fylki til þess að halda utan um þau
var kindur = [];
var ulfar = [];


// Búum til leiðir til þess að búa til kindur og úlfa
function buaTilKind(stadsetning) {
    kindur[NumKindur] =  new kind(stadsetning);
    leikur[stadsetning[0]][stadsetning[1]][stadsetning[2]] = 1;
    NumKindur++;
};
function buaTilUlfa(stadsetning) {
    ulfar[NumUlfar] = new ulfur(stadsetning);
    leikur[stadsetning[0]][stadsetning[1]][stadsetning[2]] = 2;
    NumUlfar++;
};

// Búum til nokkur dýr til þess að byrja með
buaTilKind([9,9,9]);
buaTilKind([7,7,7]);
buaTilKind([5,5,5])
buaTilUlfa([3,3,3]);
buaTilUlfa([1,1,1]);


// Breytur sem sá um hreyfingu myndavélar
var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

// Fjarlægð frá myndavél
var zDist = -50.0;

// Fylki til þess að bæta inn í punktum og litum
var points = [];
var colors = [];

// Hornpunktar rétthyrnings
var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

// Litirnir sem við notum okkur 
var vertexColors = [
    vec4( 1.0, 1.0, 1.0, 1.0 ),   // hvítur
    vec4( 0.3, 0.1, 0.1, 1.0 )    // brúnn
];



// Shader transformation matrices
var modelViewMatrix, projectionMatrix;


var modelViewMatrixLoc;

var vBuffer, cBuffer;

//----------------------------------------------------------------------------

function quad(  a,  b,  c,  d , litur) {
    colors.push(vertexColors[litur]); 
    points.push(vertices[a]); 
    colors.push(vertexColors[litur]); 
    points.push(vertices[b]); 
    colors.push(vertexColors[litur]); 
    points.push(vertices[c]);
    colors.push(vertexColors[litur]); 
    points.push(vertices[a]); 
    colors.push(vertexColors[litur]); 
    points.push(vertices[c]); 
    colors.push(vertexColors[litur]); 
    points.push(vertices[d]); 
}


function cube(litur) {
    quad( 1, 0, 3, 2 , litur );
    quad( 2, 3, 7, 6 , litur );
    quad( 3, 0, 4, 7 , litur );
    quad( 6, 5, 1, 2 , litur );
    quad( 4, 5, 6, 7 , litur );
    quad( 5, 4, 0, 1 , litur );
}

//____________________________________________

// Remmove when scale in MV.js supports scale matrices

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}


//--------------------------------------------------


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    gl.clearColor( 0.0, 0.0, 0.5, 1.0 );
    gl.enable( gl.DEPTH_TEST ); 
    
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    
    gl.useProgram( program );

    cube(0); // Kind
    cube(1); // Úlfur

    // Load shaders and use the resulting shader program
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );    
    gl.useProgram( program );

    // Create and initialize  buffer objects
    
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    projectionMatrix = perspective( 60.0, 1.0, 0.1, 100.0 );
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.clientX - origX) ) % 360;
            spinX = ( spinX + (origY - e.clientY) ) % 360;
            origX = e.clientX;
            origY = e.clientY;
        }
    } );
    
    


    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 1.0;
         } else {
             zDist -= 1.0;
         }
     }  );  
       
  
    render();
}

//----------------------------------------------------------------------------


// Teiknum dýr samkvæmt leikfylkinu
function TeiknaDyr() {
    for (let i = 0 ; i < 10; i++) {
        for (let k = 0 ; k < 10; k++) {
            for (let j = 0 ; j < 10; j++) {
                if (leikur[i][k][j] == 1) {
                    TeiknaKind(vec3(i, k, j));
                } else if (leikur[i][k][j] == 2) {
                    TeiknaUlf(vec3(i, k, j));
                }
            }
        }
    }
}


function TeiknaKind(stadsetning) {
    var s = scalem(2.0 , 2.0, 2.0);
    var instanceMatrix = mult( translate( 3*stadsetning[0] - 15, 3* stadsetning[1] - 15 ,3* stadsetning[2] - 15 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function TeiknaUlf(stadsetning) {
    var s = scalem(2.0 , 2.0, 2.0);
    var instanceMatrix = mult( translate( 3*stadsetning[0] - 15, 3* stadsetning[1] - 15 ,3* stadsetning[2] - 15 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    gl.drawArrays( gl.TRIANGLES, NumVertices, 2*NumVertices );
}

// Föll sem hreifa dýrin
function Vinstri(dyr) {
    stadsetning = dyr.stadsetning;
    if (leikur[stadsetning[0] + 1][stadsetning[1]][stadsetning[2]] == 0) {
        leikur[stadsetning[0]][stadsetning[1]][stadsetning[2]] = 0;
    leikur[stadsetning[0] + 1][stadsetning[1]][stadsetning[2]] = dyr.tala;
    return [stadsetning[0] + 1 , stadsetning[1], stadsetning[2]];
    } else {return stadsetning;}
}

function Haegri(dyr) {
    stadsetning = dyr.stadsetning;
    if (leikur[stadsetning[0] - 1][stadsetning[1]][stadsetning[2]] == 0) {
        leikur[stadsetning[0]][stadsetning[1]][stadsetning[2]] = 0;
    leikur[stadsetning[0] - 1][stadsetning[1]][stadsetning[2]] = dyr.tala;
    return [stadsetning[0] - 1 , stadsetning[1], stadsetning[2]];
    } else {return stadsetning;}
}

function Upp(dyr) {
    stadsetning = dyr.stadsetning;
    if (leikur[stadsetning[0]][stadsetning[1] + 1][stadsetning[2]] == 0) {
        leikur[stadsetning[0]][stadsetning[1]][stadsetning[2]] = 0;
    leikur[stadsetning[0]][stadsetning[1] + 1][stadsetning[2]] = dyr.tala;
    return [stadsetning[0] , stadsetning[1] + 1, stadsetning[2]];
    } else {return stadsetning;}
 }

function Nidur(dyr) {
    stadsetning = dyr.stadsetning;
    if (leikur[stadsetning[0]][stadsetning[1] - 1][stadsetning[2]] == 0) {
    leikur[stadsetning[0]][stadsetning[1]][stadsetning[2]] = 0;
    leikur[stadsetning[0]][stadsetning[1] - 1][stadsetning[2]] = dyr.tala;
    return [stadsetning[0] , stadsetning[1] - 1, stadsetning[2]];
    } else {return stadsetning;}
}

function Afram(dyr) {
    stadsetning = dyr.stadsetning;
    if (leikur[stadsetning[0]][stadsetning[1]][stadsetning[2] + 1] == 0) {
    leikur[stadsetning[0]][stadsetning[1]][stadsetning[2]] = 0;
    leikur[stadsetning[0]][stadsetning[1]][stadsetning[2] + 1] = dyr.tala;
    return [stadsetning[0] , stadsetning[1], stadsetning[2] + 1];
    } else {return stadsetning;}
}

function Aftruabak(dyr) {
    stadsetning = dyr.stadsetning;
    if (leikur[stadsetning[0]][stadsetning[1]][stadsetning[2] - 1] == 0) {
    leikur[stadsetning[0]][stadsetning[1]][stadsetning[2]] = 0;
    leikur[stadsetning[0]][stadsetning[1]][stadsetning[2] - 1] = dyr.tala;
    return [stadsetning[0] , stadsetning[1], stadsetning[2] - 1];
    } else {return stadsetning;}
}


// Handahófskend hreifing innan ramma
function hreifa(dyr) {
    if (dyr.stadsetning[0] == 0) {
        return Vinstri(dyr);
    }else if (dyr.stadsetning[0] == 9) {
        return Haegri(dyr);
    }else if (dyr.stadsetning[1] == 0) {
        return Upp(dyr);
    }else if (dyr.stadsetning[1] == 9) {
        return Nidur(dyr);
    }else if (dyr.stadsetning[2] == 0) {
        return Afram(dyr);
    }else if (dyr.stadsetning[2] == 9) {
        return Aftruabak(dyr);
    }else {
        var i = Math.random() * 6;
        if (i < 1) {
            return Afram(dyr);
        } else if (i < 2) {
            return Aftruabak(dyr);
        } else if (i < 3) {
            return Upp(dyr);
        } else if (i < 4) {
            return Nidur(dyr);
        } else if (i < 5) {
            return Vinstri(dyr);
        } else {
            return Haegri(dyr);
        }
    }

}

// Ítrar í gegnum öll dýrin og hreifir hvert og eitt þeirra
function hreifaLeikmenn() {
    for (let i = 0; i < NumKindur; i++) {
        kindur[i] = new kind(hreifa(kindur[i]));
    }
    for (let i = 0; i < NumUlfar; i++) {
        ulfar[i] = new ulfur(hreifa(ulfar[i]));
    }
}


//----------------------------------------------------------------------------


var render = function() {
    // Teljari sem hægir á hreifingu dýrana svo að hún sé sjáanleg
    if (teljari < 30) {
        teljari++;
    } else {
        teljari = 0;
        hreifaLeikmenn();
    }

    

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt( vec3(0.0, 2.0, zDist), vec3(0.0, 2.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX( spinX ) );
    mv = mult( mv, rotateY( spinY ) );


    modelViewMatrix = mult(mv, rotateY(0));
    
    TeiknaDyr();

    requestAnimFrame(render);
}


