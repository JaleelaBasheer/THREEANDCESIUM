import React, { useEffect, useRef, useState } from 'react'
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import paper from 'paper'

function Testing() {
    const canvasRef = useRef(null);
    const canvas = canvasRef.current;
    const [showRightDiv, setShowRightDiv] = useState(true);
    const [show, setShow] = useState(false);
    const [isshowcanvas, setshowcanvas] = useState(false)
    const [isDiv1Visible, setIsDiv1Visible] = useState(true);
    const [isDiv2Visible, setIsDiv2Visible] = useState(false);
    const [iscon1Visible, setIscon1Visible] = useState(true);
    const [iscon2Visible, setIscon2Visible] = useState(false);
    const [isSideNavOpen, setIsSideNavOpen] = useState(true);
    const [middleWidth, setMiddleWidth] = useState('83.5%');
    const [canvasleftm, setcanvasleftm] = useState('16.5%');
    const [RightWidth,setRightWidth] = useState('11%')
    const [canvasrightm, setcanvasrightm]=useState('0%')
    const removeRightDiv = () => {
        setShowRightDiv(false);
    };

    const addRightDiv = () => {
        setShowRightDiv(true);
    };

    const handlesidetoggle = () => {
        if (middleWidth === '72.5%') {
            setMiddleWidth('89%')
            setIsSideNavOpen(false)
            setcanvasleftm('0%')
            
        }
        else {
            setIsSideNavOpen(false)
            setMiddleWidth('100%');
            setcanvasleftm('0%')
        }

    }
    const handleopensidetoggle = () => {
        if (middleWidth === '89%') {
            setMiddleWidth('72.5')
            setcanvasleftm('16.5%')
            setcanvasrightm('11%')
            setIsSideNavOpen(true)
        }
        else {
            setIsSideNavOpen(true)
            setMiddleWidth('83.5%');
            setcanvasleftm('16.5%')
        }

    }
    const handleeditpan = () => {
        setIscon1Visible(!iscon1Visible);
        setIscon2Visible(!iscon2Visible);
        setMiddleWidth('72.5%')
    }
    const handlemineditpan = () => {
        setIscon1Visible(!iscon1Visible);
        setIscon2Visible(!iscon2Visible);
        setMiddleWidth('83.5%')
    }

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [svgContent, setSvgContent] = useState('');
    const [filename, setfilename] = useState("")
    const [getfile, setgetfile] = useState("")
    var file = {}
    const handleFileChange = (event) => {
        console.log(event);
        file = event.target.files[0];
        console.log(file);
        setgetfile(file)

        var filnam = file.name
        console.log(filnam);
        setfilename(filnam)

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                console.log(content);
                setSvgContent(content);
                setshowcanvas(true);

            };
            reader.readAsText(file);
            setIsDiv1Visible(!isDiv1Visible);
            setIsDiv2Visible(!isDiv2Visible);
        }

    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // canvas.width = window.innerWidth;
            // canvas.height = window.innerHeight;
            paper.setup(canvas);

            if (svgContent) {
                paper.project.clear();

                const svgGroup = new paper.Group();
                console.log(svgGroup);
                paper.project.importSVG(svgContent, (importedSVG) => {
                    console.log(importedSVG);
                    svgGroup.addChild(importedSVG);
                    console.log(svgGroup);
                    svgGroup.position = paper.view.center;
                    svgGroup.fitBounds(paper.view.bounds);
                    paper.view.draw();
                });
            }
        }
    }, [svgContent])
    return (

        <div className="cont" style={{overflow:'hidden'}}>
            {isSideNavOpen ?
                <div className="left border border-1 border-danger" id="sideNav">
                    <div id="spidSideLnk" class="sideLnkInactive" >

                        <i class="fa-regular fa-pen-to-square sideLnkIcon"></i>
                        <a class="sideLnk">Smart P&ID</a>
                    </div>
                    <div id="lineListSideLnk" class="sideLnkInactive" >
                        <i class="fa fa-list-alt sideLnkIcon"></i>
                        <a class="sideLnk">Line List</a>
                    </div>
                    <div id="equipListSideLnk" class="sideLnkInactive" >
                        <i class="fa fa-list-alt sideLnkIcon"></i>
                        <a class="sideLnk">Equipment List</a>
                    </div>
                    <div id="tagsSideLnk" class="sideLnkInactive" >
                        <i class="fa fa-tags sideLnkIcon"></i>
                        <a class="sideLnk">Tags</a>
                    </div>

                    <img src="images/tree.png" id="hsSideNav" onClick={handlesidetoggle} />
                </div> : <img src="images/tree.png" id="nonhsSideNav" onClick={handleopensidetoggle} />}
            {isSideNavOpen ?
                <div className="middle border border-1 border-black" id='maxmain' style={{ display: isDiv1Visible ? 'block' : 'none', width: middleWidth }}>
                    <div class='tabDiv sideLnkFDiv'>
                        <div style={{ backgroundColor: 'black' }}>
                            <div class='action-bar'>
                                <h1>Smart P&IDs</h1>
                                <i class="fa fa-plus" onClick={handleShow}></i>
                            </div>
                        </div >

                    </div>
                </div> :
                <div className="middle border border-1 border-black" id='main' style={{ display: isDiv1Visible ? 'block' : 'none', width: middleWidth }}>

                    <div class='tabDiv sideLnkFDiv'>
                        <div style={{ backgroundColor: 'black' }}>
                            <div class='action-bar'>
                                <h1>Smart P&IDs</h1>
                                <i class="fa fa-plus" onClick={handleShow} ></i>
                            </div>
                        </div>

                    </div>

                </div>
            }

            {isshowcanvas &&

                <div style={{ display: isDiv2Visible ? 'block' : 'none', width: '100%', marginLeft: canvasleftm, position: 'fixed', height: '100%',marginRight:canvasrightm }} className='border border-1 border-success '>
                    <canvas ref={canvasRef} className='border border-1 border-danger' style={{ width: middleWidth, height: '100%', position: 'absolute' }} />

                </div>
                // style={{ display: isDiv2Visible ? 'block' : 'none',width: middleWidth }}


            }
            {isshowcanvas && <div id='rightopt' style={{ display: iscon1Visible ? 'block' : 'none' }}>
                <i class="spidControl fa fa-search-plus" ></i>
                <i class="spidControl fa fa-search-minus" ></i>

                <i class="spidControl fa fa-upload" title="Export"></i>
                <i class="spidControl fa fa-pencil" onClick={handleeditpan}></i>
            </div>}

            {isshowcanvas && <div className='right' id='spidEditPane' style={{ display: iscon2Visible ? 'block' : 'none',height:'100%',width:RightWidth }}>
                <h2>Draw</h2>
                <div id="spidSvgElems">
                    <img
                        id="spidLine" class="svgElem button" src="images/line.png" title="Line"
                    /><img
                        id="spidRect" class="svgElem button" src="images/rect.png" title="Rectangle"
                    /><img
                        id="spidPolygon" class="svgElem button" src="images/polygon.png" title="Polygon"
                    />
                </div>
                <h2 id="spidSvgElemLinkHead">Link</h2>
                <button class="button svgElemLnk" >

                    <span>Select tag</span>
                </button>
                <label id="spidSvgElemLnkOr">OR</label>
                <button class="button svgElemLnk">

                    <span ng-if="!spid.editor.linkedSpid">Select smart P&amp;ID</span>
                </button>
                <div id='exrightopt'>
                    <i class="spidControl fa fa-search-plus" ></i>
                    <i class="spidControl fa fa-search-minus" ></i>

                    <i class="spidControl fa fa-upload" title="Export"></i>
                    <i class="spidControl fa fa-pencil" onClick={handlemineditpan}></i>
                </div>
            </div>}
            {/* { */}
            {/* showRightDiv && <div className="right">Right</div> */}
            {/* } */}

            {/* <button onClick={removeRightDiv}>Remove Right Div</button>
            <button onClick={addRightDiv}>Add Right Div</button> */}
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Modal heading</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicdno">

                            <Form.Control name="dno" type="text" placeholder="Enter drawing no" />

                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicdna">

                            <Form.Control name="dname" type="text" placeholder="Enter drawing name" />

                        </Form.Group>
                        <Form.Group className='mb-3' controlId='formbasicdfi'></Form.Group>
                        <Form.Control name='dfi' type='file' onChange={handleFileChange}   ></Form.Control>

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary">
                        Submit
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>

    )
}

export default Testing