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
    this.props.obj.pointer = this; //change the this pointer to point to addnewsetcomponent
    this.onSetsChange = this.onSetsChange.bind(this);
  }

  state = {
    oldNumSets: 0,
    newNumSets: 0,
  };


  onSetsChange = function (e) {
    console.log("Performing Number Of Sets Have Changed");
    console.log(
      `Old value of sets=${this.state.oldNumSets}, new value=${this.state.newNumSets}`
    );

    this.state.oldNumSets = this.state.newNumSets;
    this.state.newNumSets = e.target.value;
    if (this.state.newNumSets < 0) {
      this.state.newNumSets = 0;
      e.target.value = 0;
    }

    let children = [];

    if (this.state.oldNumSets < this.state.newNumSets) {
      for (let i = this.state.oldNumSets; i < this.state.newNumSets; ++i) {
        children.push(<Set setNumber={i} ></Set>);
      }
    } else {
      for (let i = this.state.newNumSets; i < this.state.oldNumSets; ++i) {
        children.pop();
      }
    }
    this.setState({ newNumSets: e.target.value });
  };

  addModifyButtonAction = async () => {
    console.log("Adding new movement");

    //const formElement = document.getElementById("addNewMovementForm");

    const movementName = document.getElementById("movementName").value;
    let numSets = this.state.newNumSets;
    const sets = [];
    for (let i = 0; i < numSets; i++) {
      const set = {
        weight: document.getElementById(`weight${i}`).value,
        reps: document.getElementById(`reps${i}`).value,
        rpe: document.getElementById(`RPE${i}`).value,
      };
      sets.push(set);
    }

    if(document.getElementById('addModifyButton').innerHTML === 'Add New Movement') {
      const res = await fetch(`/movement?workout_id=${this.props.workout_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movementName, numSets, sets }),
      });
    }else if (document.getElementById('addModifyButton').innerHTML === 'Edit') {
      const res = await fetch(`/movement?workout_id=${this.props.workout_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movementName, numSets, sets }),
      });
    }
  };


 

  render() {
    const children = [];
    console.log(
      `Performing render where newNumSets = ${this.state.newNumSets}`
    );

    for (var i = 0; i < this.state.newNumSets; i += 1) {
      children.push(<Set setNumber={i} />);
    }

    return (
      <div id="addNewMovementForm">
        <form onsubmit="return false" id="addNewMovementForm">
          <input type="text" placeholder="name" id="movementName" />
          <input
            type="number"
            placeholder="number of sets"
            id="numberOfSets"
            onChange={this.onSetsChange}
          />
          <div id="setsDiv">{children}</div>
        </form>
        <button id = 'addModifyButton' onClick={this.addModifyButtonAction} onChange = {this.copyMovementData}>Add New Movement</button>
      </div>
    );
  }
}

const Set = (props) => (
  <div id={"set" + props.setNumber}>
    <input id={"weight" + props.setNumber} placeholder="weight">{props.weight}</input>
    <input id={"reps" + props.setNumber} placeholder="reps">{props.reps}</input>
    <input id={"RPE" + props.setNumber} placeholder="RPE">{props.RPE}</input>
  </div>
);

const Workout = (props) => {
  const { user, loading, loggedOut } = useUser();
  const parsed = queryString.parse(props.location.search);

  //console.log(parsed);

  if (loading || !user.username) return <div>Loading</div>;
  if (loggedOut) return <Redirect to="/login" />;
  if (!parsed._id) return <Redirect to="/" />;

  const workoutRes = user.workouts.find(
    (workout) => workout._id === parsed._id
  );

  if (!workoutRes) {
    console.log("All workouts: ");
    console.log(user.workouts.map((workout) => workout._id));
    console.log("Couldn't find this workout, redirecting to /");
    return <Redirect to="/" />;
  } else {
    let obj = {pointer: this}
    let addModifyForm = <AddNewSetComponent workout_id={parsed._id} obj={obj}/>
    return (
      <div id="workoutPage">

        <h1>{workoutRes.name}</h1>
        {addModifyForm}
        {workoutRes.movements.length === 0 ? (
          <div>You have no movements yet :(</div>
        ) : (
          workoutRes.movements.map((movement) => (
            <Movement_Card_View movement={movement} form={obj.pointer} />
          ))
        )}
      </div>
    );
  }
};

export default Workout;
