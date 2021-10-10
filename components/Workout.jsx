import { Redirect } from "react-router-dom";
import React from "react";
import useUser from "../hooks/useUser";
import queryString from "query-string";
import Movement_Card_View from "./Movement_Card_View";

import "./css/workouts_style.css";
import { mutate } from "swr";

class AddNewSetComponent extends React.Component {
  constructor(props) {
    super(props);
    this.onSetsChange = this.onSetsChange.bind(this);
  }

  onSetsChange = function (e) {
    console.log("Performing Number Of Sets Have Changed");
    console.log(
      `Old value of sets=${this.props.parent.state.oldNumSets}, new value=${this.props.parent.state.newNumSets}`
    );

    if (e.target.value < 1) {
      e.target.value = 1;
    }

    let oldNumSets = this.props.parent.state.newNumSets;
    let newNumSets = e.target.value;

    if (oldNumSets < newNumSets) {
      for (let i = oldNumSets; i < newNumSets; ++i) {
        this.props.parent.state.sets.push(<Set setNumber={i}></Set>);
      }
    } else if (oldNumSets > newNumSets) {
      for (let i = newNumSets; i < oldNumSets; ++i) {
        this.props.parent.state.sets.pop();
      }
    }

    this.props.parent.setState({
      oldNumSets: this.props.parent.state.newNumSets,
      newNumSets: e.target.value,
    });
  };

  addModifyButtonAction = async () => {
    console.log("Adding new movement");

    // const formElement = document.getElementById("addNewMovementForm");
    let bad_form = false;

    const movementName = document.getElementById("movementName").value;
    let numSets = this.props.parent.state.newNumSets;
    const sets = [];
    for (let i = 0; i < numSets; i++) {
      if(document.getElementById(`weight${i}`).value == '' ||
        document.getElementById(`reps${i}`).value == '' ||
        document.getElementById(`RPE${i}`).value == '') {
        bad_form = true
      }

      const set = {
        weight: document.getElementById(`weight${i}`).value,
        reps: document.getElementById(`reps${i}`).value,
        rpe: document.getElementById(`RPE${i}`).value,
      };
      sets.push(set);
    }

    console.log(sets)

    if(movementName == '') {
      bad_form = true
    }

    if(!bad_form) {

      if (
          document.getElementById("addModifyButton").innerHTML ===
          "Add New Movement"
      ) {
        const res = await fetch(`/movement?workout_id=${this.props.workout_id}`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({movementName, numSets, sets}),
        });
      } else if (
          document.getElementById("addModifyButton").innerHTML === "Edit"
      ) {
        const res = await fetch(`/movement?workout_id=${this.props.workout_id}`, {
          method: "PATCH",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({movementName, numSets, sets}),
        });
      }
      mutate();
      location.reload();
    }
    else {
      alert("Form is missing fields")
    }
  };

  render() {
    console.log(
      `Performing render where Old value of sets=${this.props.parent.state.oldNumSets}, new value=${this.props.parent.state.newNumSets}`
    );

    return (
      <div id="addNewMovementForm">
        <form onsubmit="return false" id="addNewMovementForm">
          <input type="text" placeholder="name" id="movementName" />
          <input
            type="number"
            placeholder="number of sets"
            id="numberOfSets"
            onChange={this.onSetsChange}
            value={this.props.parent.state.newNumSets}
          />
          <div id="setsDiv">{this.props.parent.state.sets}</div>
        </form>
        <button id="addModifyButton" onClick={this.addModifyButtonAction}>
          Add New Movement
        </button>
      </div>
    );
  }
}

export class Set extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id={"set" + this.props.setNumber}>
        <input id={"weight" + this.props.setNumber} placeholder="weight" />
        <input id={"reps" + this.props.setNumber} placeholder="reps" />
        <input id={"RPE" + this.props.setNumber} placeholder="RPE" />
      </div>
    );
  }
}

class WrapperClass extends React.Component {
  constructor(props) {
    super(props);
    this.user = props.user;
    this.parsed = props.parsed;
  }

  state = {
    oldNumSets: 1,
    newNumSets: 1,
    sets: [<Set setNumber={0}></Set>],
  };

  render() {
    const workoutRes = this.user.workouts.find(
      (workout) => workout._id === this.parsed._id
    );
    console.log(workoutRes);

    if (!workoutRes) {
      console.log("All workouts: ");
      console.log(this.user.workouts.map((workout) => workout._id));
      console.log("Couldn't find this workout, redirecting to /");
      return <Redirect to="/" />;
    } else {
      return (
        <div id="workoutPage">
          <h1>{workoutRes.name}</h1>
          {workoutRes.movements.length === 0 ? (
            <div>You have no movements yet :(</div>
          ) : (
            <div id="cards">
              {" "}
              {workoutRes.movements.map((movement) => (
                <Movement_Card_View movement={movement} parent={this} />
              ))}
            </div>
          )}
          {<AddNewSetComponent workout_id={this.parsed._id} parent={this} />}
        </div>
      );
    }
  }
}

const Workout = (props) => {
  const parsed = queryString.parse(props.location.search);
  const { user, loading, loggedOut } = useUser();

  //console.log(parsed);

  if (loading || !user.username) return <div>Loading</div>;
  if (loggedOut) return <Redirect to="/login" />;
  if (!parsed._id) return <Redirect to="/" />;
  return <WrapperClass user={user} parsed={parsed} />;
};

export default Workout;
