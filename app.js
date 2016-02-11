(function (window) {

  function prepareData(rawData) {
    // Need to turn the data into something useful here...
    // For now just dump the JSON to be displayed
    return rawData;
  }

  var app = window.document.getElementById('app');

  app.connections = [];

  app.signIn = function () {
    app.set('signedIn', true);
    app.set('run', true);
    app.set(
      'accessToken',
      window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
    );
  };

  app.signOut = function () {
    if (app.connections) {
      app.splice('connections', 0, app.connections.length);
    }
    app.set('run', false);
    app.set('response', undefined);
    app.set('signedIn', false);
  };

  app.apiResponse = function (r) {
    if (!app.signedIn) {
      // Ignore response in case the user signed-out
      return;
    }
    app.set('lastError', undefined);

    r.detail.connections.forEach(function (c) {
      app.push('connections', {
        name: c.names && c.names[0] && c.names[0].displayName,
        resourceName: c.resourceName,
        loading: false,
        data: prepareData(c)
      });
    });

    /*
     * Limiting requests for now, without this line the script
     * will automatically page through all results
     */
    app.set('run', false);

    if (!r.detail.nextPageToken) {
      // Stop requests once no pageToken is returned
      app.set('run', false);
    }
  };

  app.personResponse = function (r) {
    if (!app.signedIn) {
      // Ignore response in case the user signed-out
      return;
    }
    app.set('lastError', undefined);
    var id = r.detail.resourceName;
    for (var i = 0; i < app.connections.length; i++) {
      if (app.connections[i].resourceName === id) {
        app.set(['connections', i, 'loaded'], true);
        app.set(['connections', i, 'loading'], false);
        app.set(['connections', i, 'data'], prepareData(r.detail));
        break;
      }
    }
    app.$.list.fire('iron-resize');
  };

  app.loadMore = function (e) {
    var model = e.model;
    model.set('item.loading', true);
    app.set('currentPerson', model.item.resourceName);
    app.$.personRequest.go();
  };

  app.apiError = function(e) {
    app.set('lastError', e.detail);
    for (var i = 0; i < app.connections.length; i++) {
      app.set(['connections', i, 'loading'], false);
    }
    app.set('run', false);
  };

  app.runRequest = function (accessToken, run) {
    return (!!accessToken && (accessToken !== '') && run);
  };

  app.jsonDump = function (response) {
    return JSON.stringify(response, null, 2);
  };

}(this));