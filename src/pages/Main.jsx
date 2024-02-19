import React,{useState,useEffect} from 'react'
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import EditIcon from '@mui/icons-material/Edit';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import AddBoxIcon from '@mui/icons-material/AddBox';
import New from '../components/NewComponent'
import { Link } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import MoveIcon from '@mui/icons-material/OpenWith';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import MapIcon from '@mui/icons-material/Map';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import { Card, Form,FloatingLabel, Row, Button } from 'react-bootstrap'
import GridOnIcon from '@mui/icons-material/GridOn';

function Main() {
  const drawerWidth = 240;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetList, setAssetList] = useState([]);
  const [cubes, setCubes] = useState([]);
  const [cubeId, setCubeId] = useState(0);
  const [size, setSize] = useState([1, 1, 1]);
  const [position, setPosition] = useState([0, 0, 0]);
  const [color, setColor] = useState('#00ff00');
  const [name, setName] = useState('Cube');
  const ionAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE'

  useEffect(()=>{
    const fetchAssetDetails = async () => {
      try {
        const response = await fetch(`https://api.cesium.com/v1/assets`, {
          headers: {
            Authorization: `Bearer ${ionAccessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
        setAssetList(data.items);
         
        } else {
          console.error('Error fetching asset details:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching asset details:', error.message);
      }
    };
    fetchAssetDetails();
   
  },[assetList,ionAccessToken])
 
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);
const theme = useTheme();
const [open, setOpen] = useState(false);

const handleDrawerOpen = () => {
  setOpen(true);
};

const handleDrawerClose = () => {
  setOpen(false);
};

  return (
    <> 
      <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
           PLANT DESK
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />

<List>
         
<ListItem disablePadding sx={{ display: 'block' }}>
  <button className="btn" sx={{ width: '100%' }}>
    <ListItemIcon sx={{ justifyContent: 'center' }}>
    <GridOnIcon/>
         </ListItemIcon>
        <ListItemText
        primary={''}
        sx={{
          textAlign: 'center',
          display: open ? 'inline' : 'none', // Show text when drawer is open
        }}
      />  
    <select style={{ width: '100%' }} onClick={(e) => e.stopPropagation()} >
      <option value="">Select Asset</option>
      {assetList.map(asset => (
        <option key={asset.id} value={asset.id}>{asset.name}-{asset.id}</option>
      ))}
    </select>
  </button>
</ListItem>      
           
  <ListItem disablePadding sx={{ display: 'block' }}>
    <Link to={ '/add'} className="btn" sx={{ width: '100%' }}>
      <ListItemIcon sx={{ justifyContent: 'center' }}>
      <AddIcon /> 
      </ListItemIcon>
      <ListItemText
        primary={'Add Asset'}
        sx={{
          textAlign: 'center',
          display: open ? 'inline' : 'none', // Show text when drawer is open
        }}
      />   
      </Link>
  </ListItem>

  <ListItem disablePadding sx={{ display: 'block' }}>
      <button className="btn" sx={{ width: '100%' }} data-bs-toggle="modal" data-bs-target="#staticBackdrop" >
        <ListItemIcon sx={{ justifyContent: 'center' }}>
          <AddBoxIcon />
        </ListItemIcon>
        <ListItemText primary={'Create Box'} sx={{
          textAlign: 'center',
          display: open ? 'inline' : 'none', // Show text when drawer is open
        }} />
      </button>
  </ListItem>
  <ListItem disablePadding sx={{ display: 'block' }}>
    <button className="btn" sx={{ width: '100%' }}  data-bs-toggle="modal" data-bs-target="#staticBackdrop1">
      <ListItemIcon sx={{ justifyContent: 'center' }}>
      <EditIcon />      
      </ListItemIcon>
      <ListItemText primary={'Edit Box'}  sx={{
          textAlign: 'center',
          display: open ? 'inline' : 'none', // Show text when drawer is open
        }} />
    </button>
  </ListItem>
  <ListItem disablePadding sx={{ display: 'block' }}>
    <button className="btn" sx={{ width: '100%' }}>
      <ListItemIcon sx={{ justifyContent: 'center' }}>
      <RotateRightIcon />
      </ListItemIcon>
      <ListItemText primary={'Rotate'}  sx={{
          textAlign: 'center',
          display: open ? 'inline' : 'none', // Show text when drawer is open
        }} />
    </button>
  </ListItem>
  <ListItem disablePadding sx={{ display: 'block' }}>
    <button className="btn" sx={{ width: '100%' }}>
      <ListItemIcon sx={{ justifyContent: 'center' }}>
      <MoveIcon />
            </ListItemIcon>
      <ListItemText primary={'Move'}  sx={{
          textAlign: 'center',
          display: open ? 'inline' : 'none', // Show text when drawer is open
        }} />
    </button>
  </ListItem>
  <ListItem disablePadding sx={{ display: 'block' }}>
    <button className="btn" sx={{ width: '100%' }}>
      <ListItemIcon sx={{ justifyContent: 'center' }}>
      <ZoomInMapIcon />      </ListItemIcon>
      <ListItemText primary={'Scale'}  sx={{
          textAlign: 'center',
          display: open ? 'inline' : 'none', // Show text when drawer is open
        }} />
    </button>
  </ListItem>
  <ListItem disablePadding sx={{ display: 'block' }}>
    <button className="btn" sx={{ width: '100%' }}>
      <ListItemIcon sx={{ justifyContent: 'center' }}>
      <MapIcon  />      
      </ListItemIcon>
      <ListItemText primary={'Plane View'}  sx={{
          textAlign: 'center',
          display: open ? 'inline' : 'none', // Show text when drawer is open
        }} />
    </button>
  </ListItem>
  <ListItem disablePadding sx={{ display: 'block' }}>
    <button className="btn" sx={{ width: '100%' }}>
      <ListItemIcon sx={{ justifyContent: 'center' }}>
      <ViewSidebarIcon  />      
      </ListItemIcon>
      <ListItemText primary={'Side View'}  sx={{
          textAlign: 'center',
          display: open ? 'inline' : 'none', // Show text when drawer is open
        }} />
    </button>
  </ListItem>
</List>

      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        <New ionAccessToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE" className="mt-5"/>
      </Box>
    </Box>


 {/*modal for create box */}
 <div class="modal fade mt-5" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true"> 

  <div className="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="staticBackdropLabel">Create Box</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
     <Card className="shadow border rounded p-2 mt-3">
        
    <Form>
    <Row>
    <FloatingLabel controlId="floatingInputSize" label="Size" className="mb-3 col-lg-6">
    <Form.Control type="text" placeholder="Size" name="Size" value={size.join(',')}
            onChange={(e) => setSize(e.target.value.split(',').map(parseFloat))} />
    </FloatingLabel>


    <FloatingLabel controlId="floatingInputPosition" label="Position"  className="mb-3 col-lg-6">
    <Form.Control type="text" placeholder="Position" name="Position" value={position.join(',')} onChange={(e) => setPosition(e.target.value.split(',').map(parseFloat))}/>
    </FloatingLabel>

    <FloatingLabel controlId="floatingInputColor" label="Color"  className="mb-3 col-lg-6">
    <Form.Control  placeholder="Color" name="Color"
         type="color" value={color} onChange={(e) => setColor(e.target.value)} /> 
    </FloatingLabel>

    <FloatingLabel controlId="floatingInputName" label="Name"  className="mb-3 col-lg-6">
    <Form.Control type="text" placeholder="Name" name="Name" value={name} onChange={(e) => setName(e.target.value)}/>
    </FloatingLabel>
  

    </Row>

    </Form>

    </Card>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close</button>
        <button type="button"  class="btn btn-success">Create</button>
      </div>
    </div>
  </div>
</div> 

  {/*modal for edit box */}
 <div class="modal fade mt-5" id="staticBackdrop1" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true"> 

<div className="modal-dialog">
  <div class="modal-content">
    <div class="modal-header">
      <h1 class="modal-title fs-5" id="staticBackdropLabel">Edit Box</h1>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
   <Card className="shadow border rounded p-2 mt-3">
      
  <Form>
  <Row>
  <FloatingLabel controlId="floatingInputSize" label="Size" className="mb-3 col-lg-6">
  <Form.Control type="text" placeholder="Size" name="Size" value={size.join(',')}
          onChange={(e) => setSize(e.target.value.split(',').map(parseFloat))} />
  </FloatingLabel>


  <FloatingLabel controlId="floatingInputPosition" label="Position"  className="mb-3 col-lg-6">
  <Form.Control type="text" placeholder="Position" name="Position" value={position.join(',')} onChange={(e) => setPosition(e.target.value.split(',').map(parseFloat))}/>
  </FloatingLabel>

  <FloatingLabel controlId="floatingInputColor" label="Color"  className="mb-3 col-lg-6">
  <Form.Control  placeholder="Color" name="Color"
       type="color" value={color} onChange={(e) => setColor(e.target.value)} /> 
  </FloatingLabel>

  <FloatingLabel controlId="floatingInputName" label="Name"  className="mb-3 col-lg-6">
  <Form.Control type="text" placeholder="Name" name="Name" value={name} onChange={(e) => setName(e.target.value)}/>
  </FloatingLabel>


  </Row>

  </Form>

  </Card>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close</button>
      <button type="button"  class="btn btn-success">Update</button>
    </div>
  </div>
</div>
</div> 

    </>
    
  )
}

export default Main