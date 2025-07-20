export default {
	/*
	 * getTitle(setState, getState, stateUpdate)
	 * setState: A function to set a state
	 * getState: A function to get a state
	 * stateUpdate: A function to update the displayed page
	*/
	getTitle: function(setState, getState, stateUpdate) {
		return "Error"
	},

	/*
	 * init(renderer, setState, getState, stateUpdate)
	 * setState: A function to set a state
	 * getState: A function to get a state
	 * stateUpdate: A function to update the displayed page
	*/
	init: async function(setState, getState, stateUpdate) {

	},

	/*
	 * style(setState, getState, stateUpdate)
	 * setState: A function to set a state
	 * getState: A function to get a state
	 * stateUpdate: A function to update the displayed page
	*/
	style: function(setState, getState, stateUpdate) {
		return `
		`
	},

	/*
	 * render(setState, getState, stateUpdate)
	 * This can't be async because it's used in the render function
	 * setState: A function to set a state
	 * getState: A function to get a state
	 * stateUpdate: A function to update the displayed page
	 * loadComponent: A function to load a component
	*/
	render: function(render, setState, getState, stateUpdate, loadComponent) {
		return render`
			<div id="root">
				<h1>404</h1>
				<p>Page not found</p>
				<a href="/">Go to home</a>
			</div>
		`
	},

	/*
	 * onEvent(type, data, setState, getState, stateUpdate)
	 * type: A string representing the event type
	 * data: An object containing the event data
	 * setState: A function to set a state
	 * getState: A function to get a state
	 * stateUpdate: A function to update the displayed page
	*/
	onEvent: function(type, data, setState, getState, stateUpdate) {

	}
}