import React from "react"
import { withStyles } from "@material-ui/core/styles"
import {
  Collapse,
  Typography,
  Switch,
  Fab,
  TextField,
  FormControl,
  Select,
  InputLabel,
  MenuItem,
  Backdrop,
  LinearProgress,
} from "@material-ui/core"
import { SaveOutlined, CloseOutlined } from "@material-ui/icons"
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers"
import DateFnsUtils from "@date-io/date-fns"
import sub from "date-fns/sub"
import isPast from "date-fns/isPast"
import dateDelta from "date-fns/differenceInDays"
//import { Link } from "react-router-dom"

class EditTask extends React.Component {
  state = {
    lists: [],
    listname: "",
    importance: 0,
    setReminder: false,
    reminder: new Date(),
    notifTimeDelta: 0.5,
    loading: true,
  }
  constructor(props) {
    super(props)
    this.classes = props.classes
    this.taskID = props.match.params.id
    this.updateImportance = this.updateImportance.bind(this)
    this.updateListname = this.updateListname.bind(this)
    this.updateReminder = this.updateReminder.bind(this)
    this.updateReminderTime = this.updateReminderTime.bind(this)
    this.updateNotifDelta = this.updateNotifDelta.bind(this)
    this.validateDate = this.validateDate.bind(this)
    this.updateTodo = this.updateTodo.bind(this)
  }

  componentDidMount() {
    if (window.setTitle) window.setTitle("Edit")
    document.title = "Edit"
    let getData = () => {
      window.database.getMultipleByFilters(
        "lists",
        "name",
        {
          filter: "__ne",
          val: "",
        },
        lists => {
          window.database.get("tasks", this.taskID).onsuccess = evt => {
            let entry = evt.target.result
            this.setState({
              ...this.state,
              loading: false,
              title: entry.title,
              description: entry.description,
              reminder: entry.deadline,
              notifTimeDelta: entry.notifTimeDelta,
              importance: entry.starred,
              setReminder: entry.reminder ? true : false,
              listname: entry.parent,
              lists,
            })
          }
        }
      )
    }
    if (!window.database) {
      import("../database").then(database => {
        console.log("[indexedDB] Creating database instance")
        let db = new database.default()
        db.onsuccess = _evt => {
          window.database = db
          getData()
        }
      })
    } else {
      getData()
    }
  }

  updateListname(evt) {
    this.setState({
      ...this.state,
      listname: evt.target.value,
    })
  }

  updateImportance(evt) {
    this.setState({
      ...this.state,
      importance: evt.target.value,
    })
  }

  updateReminder(evt) {
    this.setState({
      ...this.state,
      setReminder: evt.target.checked,
    })
  }
  updateReminderTime(newDate) {
    this.setState({
      ...this.state,
      reminder: newDate,
    })
  }

  updateNotifDelta(evt) {
    this.setState({
      ...this.state,
      notifTimeDelta: evt.target.value,
    })
  }

  validateDate() {
    this.setState({
      ...this.state,
      nameError: false,
      dateError: false,
    })
    if (!document.getElementById("task-title").value) {
      this.setState({
        ...this.state,
        nameError: "Please enter a title for the task",
      })
    } else if (this.state.setReminder) {
      let date = new Date(this.state.reminder)
      let delta = this.state.notifTimeDelta
      let days, hours, minutes
      minutes = delta * 10
      hours = (minutes - (minutes % 60)) / 60
      minutes = minutes - hours * 60
      days = (hours - (hours % 24)) / 24
      hours = hours - days * 24
      date = sub(date, {
        days,
        hours,
        minutes,
      })

      if (isPast(date)) {
        this.setState({
          ...this.state,
          dateError: "You can not choose a past date!",
        })
      } else {
        if (dateDelta(date, new Date()) > 25) {
          this.setState({
            ...this.state,
            dateError:
              "Cannot set reminder for a task that is due more than 25 days from now",
          })
        } else {
          if (!window.database) {
            import("../database").then(database => {
              console.log("[indexedDB] Creating database instance")
              let db = new database.default()
              db.onsuccess = _evt => {
                window.database = db
                this.updateTodo(date, delta)
              }
            })
          } else {
            this.updateTodo(date, delta)
          }
        }
      }
    } else {
      if (!window.database) {
        import("../database").then(database => {
          console.log("[indexedDB] Creating database instance")
          let db = new database.default()
          db.onsuccess = _evt => {
            window.database = db
            this.updateTodo(null)
          }
        })
      } else {
        this.updateTodo(null)
      }
    }
  }

  updateTodo(date, delta) {
    if (window.snackbar) {
      window.snackbar.show({
        text: "Updating todo...",
        showActionButton: false,
      })
    }

    import("../todo_template").then(todo_template => {
      let todo = new todo_template.default.Todo(
        {
          title: document.getElementById("task-edit-title").value,
          description: document.getElementById("task-edit-description").value,
          parent: this.state.listname,
          reminder: date,
          deadline: this.state.setReminder ? this.state.reminder : null,
          starred: this.state.importance,
          done: false,
          status: 0,
          notifTimeDelta: delta,
        },
        () => {
          window.database.update(
            "tasks",
            this.taskID,
            todo
          ).onsuccess = evt => {
            if (evt.target.result) {
              window.snackbar.show({
                text: `Updated todo.`,
                showActionButton: false,
              })
              this.props.history.goBack()
            }
          }
        }
      )
    })
  }

  render() {
    return (
      <div className={this.props.classes.root}>
        {this.state.loading ? (
          <Backdrop open={true}>
            <Typography>Loading the details of your todo...</Typography>
            <LinearProgress />
          </Backdrop>
        ) : (
          <div>
            <form autoComplete="false">
              <TextField
                className={this.classes.input}
                variant="outlined"
                label="Enter task name"
                id="task-edit-title"
                autoComplete="off"
                error={this.state.nameError ? true : false}
                helperText={this.state.nameError || ""}
                value={this.state.title}
              />
              <TextField
                className={this.classes.input}
                variant="outlined"
                autoComplete="off"
                id="task-edit-description"
                label="Enter task details (Optional)"
                value={this.state.description || ""}
                multiline
              />
              <FormControl
                variant="outlined"
                className={this.classes.formControl}
              >
                <InputLabel id="list-edit-choosing-label">
                  Choose where to add
                </InputLabel>
                <Select
                  labelId="list-edit-choosing-label"
                  id="list-edit-chooser"
                  value={this.state.lists ? this.state.listname : -1}
                  disabled={!this.state.lists}
                  onChange={this.updateListname}
                  label="Choose where to add"
                >
                  {this.state.lists ? (
                    this.state.lists.map(list => (
                      <MenuItem value={list.id} key={list.id}>
                        {list.name.capitalize()}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value={-1}>Loading...</MenuItem>
                  )}
                </Select>
              </FormControl>
              <FormControl
                variant="outlined"
                className={this.classes.formControl}
              >
                <InputLabel id="importance-edit-choosing-label">
                  Important?
                </InputLabel>
                <Select
                  labelId="importance-edit-choosing-label"
                  id="importance-edit-chooser"
                  value={this.state.importance}
                  onChange={this.updateImportance}
                  label="Important?"
                >
                  <MenuItem value={1}>Yes</MenuItem>
                  <MenuItem value={0}>No</MenuItem>
                </Select>
              </FormControl>
              <div className={this.classes.reminders}>
                <div className={this.classes.reminderControl}>
                  <Typography component="span">Reminders</Typography>
                  <div className={this.classes.grow} />
                  <Switch
                    checked={this.state.setReminder}
                    onChange={this.updateReminder}
                    color="primary"
                  />
                </div>
                <Collapse
                  in={this.state.setReminder}
                  className={`${this.classes.collapse} ${
                    this.state.setReminder
                      ? this.classes.reminderOn
                      : this.classes.reminderOff
                  }`}
                >
                  <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <DateTimePicker
                      label="Pick a date & time"
                      variant="dialog"
                      inputVariant="outlined"
                      value={this.state.reminder || ""}
                      onChange={this.updateReminderTime}
                      error={this.state.dateError ? true : false}
                      helperText={this.state.dateError || ""}
                    />
                  </MuiPickersUtilsProvider>
                  <FormControl variant="outlined">
                    <InputLabel id="notif-delta-edit-choosing-label">
                      When should we remind you?
                    </InputLabel>
                    <Select
                      labelId="notif-delta-edit-choosing-label"
                      id="notif-delta-edit-chooser"
                      value={this.state.notifTimeDelta || ""}
                      onChange={this.updateNotifDelta}
                      label="When should we remind you?"
                    >
                      <MenuItem value={0.1}>1 min before</MenuItem>
                      <MenuItem value={0.2}>2 min before</MenuItem>
                      <MenuItem value={0.5}>5 min before</MenuItem>
                      <MenuItem value={1.0}>10 min before</MenuItem>
                      <MenuItem value={1.5}>15 min before</MenuItem>
                      <MenuItem value={3}>30 min before</MenuItem>
                      <MenuItem value={6}>1 hr before</MenuItem>
                      <MenuItem value={12}>2 hr before</MenuItem>
                      <MenuItem value={36}>6 hr before</MenuItem>
                      <MenuItem value={144}>1 day before</MenuItem>
                    </Select>
                  </FormControl>
                </Collapse>
              </div>
            </form>
            <Fab
              className={this.classes.fabRight}
              variant="extended"
              color="primary"
              onClick={this.validateDate}
            >
              <SaveOutlined className={this.classes.fabIcon} />
              Save
            </Fab>
            <Fab
              className={this.classes.fabLeft}
              variant="extended"
              onClick={this.props.history.goBack}
            >
              <CloseOutlined className={this.classes.fabIcon} />
              Cancel
            </Fab>
          </div>
        )}
      </div>
    )
  }
}

/**
 * Get the list styled and export it.
 */
export default withStyles(theme => ({
  root: {
    display: "block",
    maxHeight: "calc(85vh - 70px)",
  },
  formControl: {
    margin: theme.spacing(1),
    marginLeft: 0,
    width: "45%",
  },
  grow: {
    flexGrow: 1,
  },
  fabRight: {
    position: "fixed",
    bottom: 25,
    right: 25,
  },
  fabLeft: () => {
    let preset = {
      position: "fixed",
      bottom: 25,
      left: 25,
    }

    if (window.innerWidth > theme.breakpoints.values.sm) {
      preset.left = 265
    }

    return preset
  },
  fabIcon: {
    marginRight: theme.spacing(1),
  },
  input: {
    margin: theme.spacing(1),
    marginLeft: 0,
    width: "100%",
  },
  reminders: {
    width: "100%",
    margin: theme.spacing(1),
    marginLeft: 0,
    borderRadius: 4,
    border: "1px solid rgba(150, 150, 150, 0.4)",
    "& .MuiTypography-root": {
      padding: 8,
    },
    "& .MuiSwitch-root": {
      float: "right",
    },
    ":hover": {
      border: "1px solid white",
    },
  },
  reminderControl: {
    padding: theme.spacing(1.5),
    width: "100%",
    display: "flex",
  },
  reminderOn: {
    padding: theme.spacing(2),
  },
  reminderOff: {
    padding: 0,
  },
  collapse: {
    "& .MuiFormControl-root": {
      margin: theme.spacing(1),
      marginLeft: 0,
      width: "-webkit-fill-available",
    },
  },
}))(EditTask)
