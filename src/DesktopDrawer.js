import React from "react"
import { makeStyles } from "@material-ui/core/styles"
import {
  Typography,
  AppBar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Toolbar,
  IconButton,
  Badge,
} from "@material-ui/core"

import {
  NotificationsNoneOutlined as BellIcon,
  StarBorderOutlined as StarIcon,
  CheckOutlined as CheckIcon,
  ClearOutlined as CrossIcon,
  QueryBuilderOutlined as PendingIcon,
  TodayOutlined as DayIcon,
  AttachMoneyOutlined as BillsIcon,
  ShoppingCartOutlined as ShoppingIcon,
  WorkOutline as WorkIcon,
  InfoOutlined as InfoIcon
} from "@material-ui/icons"

const drawerWidth = 240

const useStyles = makeStyles(theme => ({
  drawer: {
    [theme.breakpoints.up("sm")]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    background: "transparent",
    [theme.breakpoints.up("sm")]: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
  },
  // necessary for content to be below app bar
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
  grow: {
    flexGrow: 1,
  },
}))

export default function DesktopMenu() {
  const classes = useStyles()

  return (
    <div>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            todox
          </Typography>

          <div className={classes.grow} />
          <IconButton
            edge="end"
            color="inherit"
            aria-label="Show Notifications"
          >
            <Badge badgeContent={6} color="secondary" max={9}>
              <BellIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      <nav className={classes.drawer}>
        <Drawer
          classes={{
            paper: classes.drawerPaper,
          }}
          variant="permanent"
          open
        >
          <div>
            <div className={classes.toolbar} />
            <Divider />
            <List>
              <ListItem button>
                <ListItemIcon><DayIcon /></ListItemIcon>
                <ListItemText primary={"My Day"} />
              </ListItem>
              <ListItem button>
                <ListItemIcon><StarIcon /></ListItemIcon>
                <ListItemText primary={"Starred Tasks"} />
              </ListItem>
              <ListItem button>
                <ListItemIcon><BillsIcon /></ListItemIcon>
                <ListItemText primary={"Bills"} />
              </ListItem>
              <ListItem button>
                <ListItemIcon><ShoppingIcon /></ListItemIcon>
                <ListItemText primary={"Shopping List"} />
              </ListItem>
              <ListItem button>
                <ListItemIcon><WorkIcon /></ListItemIcon>
                <ListItemText primary={"Work"} />
              </ListItem>
            </List>
            <Divider />
            <List>
              <ListItem button>
                <ListItemIcon>
                  <PendingIcon />
                </ListItemIcon>
                <ListItemText primary={"Pending"} />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <CheckIcon />
                </ListItemIcon>
                <ListItemText primary={"Done"} />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <CrossIcon />
                </ListItemIcon>
                <ListItemText primary={"Missing"} />
              </ListItem>
            </List>
			<Divider />
			<List>
				<ListItem button>
					<ListItemIcon><InfoIcon /></ListItemIcon>
					<ListItemText primary="About us" />
				</ListItem>
			</List>
          </div>
        </Drawer>
      </nav>
    </div>
  )
}
