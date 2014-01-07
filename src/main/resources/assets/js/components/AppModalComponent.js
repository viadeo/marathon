/** @jsx React.DOM */

define([
  "React",
  "jsx!components/ModalComponent",
  "jsx!components/TaskListComponent",
  "mixins/BackboneMixin"
], function(React, ModalComponent, TaskListComponent, BackboneMixin) {
  return React.createClass({
    destroy: function() {
      this.refs.modalComponent.destroy();
    },
    destroyApp: function() {
      if (confirm("Destroy app '" + this.props.model.get("id") + "'?\nThis is irreversible.")) {
        this.props.model.destroy();
        this.refs.modalComponent.destroy();
      }
    },
    getInitialState: function() {
      return {
        selectedTasks: {}
      };
    },
    killSelectedTasks: function(options) {
      var _this = this;
      var _options = options || {};

      var selectedTaskIds = Object.keys(this.state.selectedTasks);
      var tasksToKill = this.props.model.get("tasks").filter(function(task) {
        return selectedTaskIds.indexOf(task.id) >= 0;
      });

      tasksToKill.forEach(function(task) {
        task.destroy({
          scale: _options.scale,
          success: function() {
            var instances;
            if (_options.scale) {
              instances = _this.props.model.get("instances");
              _this.props.model.set("instances", instances - 1);
            }

            delete _this.state.selectedTasks[task.id];
            _this.forceUpdate();
          },
          wait: true
        });
      });
    },
    killSelectedTasksAndScale: function() {
      this.killSelectedTasks({scale: true});
    },
    mixins: [BackboneMixin],
    refreshTaskList: function() {
      this.refs.taskList.fetchTasks();
    },
    render: function() {
      var buttons;
      var model = this.props.model;

      if (Object.keys(this.state.selectedTasks).length === 0) {
        buttons =
          <p>
            <button className="btn btn-sm btn-default" onClick={this.refreshTaskList}>
              ↻ Refresh
            </button>
          </p>;
      } else {
        buttons =
          <p class="btn-group">
            <button className="btn btn-sm btn-default" onClick={this.killSelectedTasks}>
              Kill
            </button>
            <button className="btn btn-sm btn-default" onClick={this.killSelectedTasksAndScale}>
              Kill &amp; Scale
            </button>
          </p>;
      }

      return (
        <ModalComponent ref="modalComponent">
          <div className="modal-header">
             <button type="button" className="close"
                aria-hidden="true" onClick={this.destroy}>&times;</button>
            <h3 className="modal-title">{model.get("id")}</h3>
          </div>
          <div className="modal-body">
            <dl className="dl-horizontal">
              <dt>CMD:</dt><dd>{model.get("cmd")}</dd>
              <dt>URIs:</dt><dd>{model.get("uris").length}</dd>
              <dt>Memory (MB):</dt><dd>{model.get("mem")}</dd>
              <dt>CPUs:</dt><dd>{model.get("cpus")}</dd>
              <dt>Instances:</dt><dd>{model.get("instances")}</dd>
            </dl>
            {buttons}
            <TaskListComponent collection={model.get("tasks")}
              ref="taskList" selectedTasks={this.state.selectedTasks}
              onTaskSelect={this.selectTask} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-sm btn-danger" onClick={this.destroyApp}>
              DESTROY
            </button>
            <button className="btn btn-sm btn-default"
                onClick={this.suspendApp} disabled={this.props.model.get("instances") < 1}>
              SUSPEND
            </button>
            <button className="btn btn-sm btn-default" onClick={this.scaleApp}>
              SCALE
            </button>
          </div>
        </ModalComponent>
      );
    },
    scaleApp: function() {
      var instances = prompt("Scale to how many instances?",
        this.props.model.get("instances"));

      if (instances != null) {
        this.props.model.scale(parseInt(instances, 10));
      }
    },
    selectTask: function(task, event) {
      var selectedTasks = this.state.selectedTasks;

      if (event.target.checked) {
        selectedTasks[task.id] = true;
      } else {
        delete selectedTasks[task.id];
      }

      this.setState({selectedTasks: selectedTasks});
    },
    suspendApp: function() {
      if (confirm("Suspend app by scaling to 0 instances?")) {
        this.props.model.scale(0);
      }
    }
  });
});
