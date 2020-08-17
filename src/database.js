class db {
  /**
   *
   * @param {String} databasename Name of the database to open
   * Creates a database object with the name provided.
   * Default name: todox-v1
   */
  constructor(databasename) {
    //Database name
    databasename = databasename || "todox-v1"

    //Open the database
    this.request = window.indexedDB.open(databasename)

    //Handle some events
    this.request.onsuccess = evt => {
      this.db = evt.target.result
      try {
        this.onsuccess(evt)
      } catch (e) {
        console.warn(e)
        console.log("[indexedDB] DB creation success")
      }
    }
    this.request.onerror = evt => {
      try {
        this.onerror(evt)
      } catch (e) {
        console.warn(e)
        console.log("[indexedDB] Database error:" + this.request.errorCode)
      }
    }
    this.request.onupgradeneeded = evt => {
      this.db = evt.target.result
      this.objectStores = {}

      //Create object stores
      this.objectStores.lists = this.db.createObjectStore("lists", {
        keyPath: "id",
      })
      this.objectStores.tasks = this.db.createObjectStore("tasks", {
        keyPath: "id",
      })
      this.objectStores.meta = this.db.createObjectStore("meta")

      //Create search indexes
      this.objectStores.lists.createIndex("name", "name", { unique: true })
      this.objectStores.tasks.createIndex("name", "name", { unique: false })
      this.objectStores.tasks.createIndex("date", "date", { unique: false })
      this.objectStores.tasks.createIndex("starred", "starred", {
        unique: false,
      })
    }

    this.objectStores = {}
  }

  /**
   *
   * @param {String} objectStore
   * @param {Object} data
   * @param {Function} onerror
   * @param {Function} onsuccess
   *
   * This function adds the object 'data' to the given objectStore.
   *
   * @returns {IDBRequest} The request event of objectStore.add method
   */
  add(objectStore, data, onerror, onsuccess) {
    let transaction = this.db.transaction([objectStore], "readwrite")
    transaction.onerrror =
      onerror || (evt => console.log("[indexedDB] DB Add error: " + evt))
    transaction.oncomplete =
      onsuccess || (evt => console.log("[indexedDB] Task success: " + evt))

    // Return the request object
    return transaction.objectStore(objectStore).add(data)
  }

  /**
   *
   * @param {String} objStore
   * @param {String} id
   * @param {Function} onerror
   * @param {Function} onsuccess
   *
   * Delete a entry in the given objectStore ith the given id.
   *
   * @returns {IDBRequest} The delete request
   */
  delete(objStore, id, onerror, onsuccess) {
    let transaction = this.db.transaction([objStore], "readwrite")
    transaction.onerrror =
      onerror || (evt => console.log("[indexedDB] DB Add error: " + evt))
    transaction.oncomplete =
      onsuccess || (evt => console.log("[indexedDB] Task success: " + evt))

    // Return the request object
    return transaction.objectStore(objStore).delete(id)
  }

  /**
   *
   * @param {String} objStore
   * @param {String} id
   * @param {Function} onerror
   * @param {Function} onsuccess
   *
   * @returns {IDBRequest} The get request of the get function
   */
  get(objStore, id, onerror, onsuccess) {
    let transaction = this.db.transaction([objStore], "readwrite")
    transaction.onerrror =
      onerror || (evt => console.log("[indexedDB] DB Add error: " + evt))
    transaction.oncomplete =
      onsuccess || (evt => console.log("[indexedDB] Task success: " + evt))

    // Return the request object
    return transaction.objectStore(objStore).get(id)
  }

  /**
   *
   * @param {String} objStore
   * @param {String} id
   * @param {Object} newData
   * @param {Function} onsuccess
   * @param {Function} onerror
   *
   * Updates the entry of given id with he new data
   *
   * @returns {IDBRequest} The update request
   */
  update(objStore, id, newData, onsuccess, onerror) {
    let transaction = this.db.transaction([objStore], "readwrite")
    transaction.onerrror =
      onerror || (evt => console.log("[indexedDB] DB Add error: " + evt))
    transaction.oncomplete =
      onsuccess || (evt => console.log("[indexedDB] Task success: " + evt))

    let objectStore = transaction.objectStore(objStore)
    objectStore.get(id).onsuccess = evt => {
      var data = evt.target.result
      data = { ...data, newData }

      return objectStore.put(data)
    }
  }

  /**
   *
   * @param {String} objStore
   * @param {String} index
   * @param {Sring} value
   * @param {Function} onerror
   * @param {Function} onsuccess
   *
   * Gets an entry by the index of the given value
   *
   * @returns {IDBRequest} Request of the get request
   */
  getByIndex(objStore, index, value, onerror, onsuccess) {
    let transaction = this.db.transaction([objStore], "readwrite")
    transaction.onerrror =
      onerror || (evt => console.log("[indexedDB] DB Add error: " + evt))
    transaction.oncomplete =
      onsuccess || (evt => console.log("[indexedDB] Task success: " + evt))

    return transaction.objectStore(objStore).index(index).get(value)
  }

  /**
   *
   * @param {String} objStore
   * @param {String} key
   * @param {String} value
   * @param {Number} limit
   *
   * Returns an array of all the entries in `objStore`
   * with the same key:value pair as given.
   *
   * Limit is a number that defines the max number of entries to find
   *
   * @returns {Array}
   */
  getMultipleByKey(objStore, key, value, limit) {
    let store = this.db.transaction([objStore]).objectStore(objStore)
    let matched = []

    store.openCursor().onsucces = evt => {
      var cursor = evt.target.result
      if (cursor) {
        if (cursor.value[key] === value) {
          matched.push(cursor.value)
        }
        if (!limit || matched.length <= limit) {
          cursor.continue()
        }
      }
    }
    return matched
  }

  /**
   *
   * @param {String} objStore
   * @param {String} key
   * @param {String} value
   * @param {Number} limit
   *
   * Finds all the entries in the given objectStore but this
   * time, the value is not the exact value but the filters you want
   * to match the entries with.
   *
   * Supported filters:
   *
   * - __lt: Less than a certain value
   * - __lte: Less than or equal to given value
   * - __gt: Greater than given value
   * - __gte: Greater than or equal than given value
   * - __re: A Regular Expression to match the entries.
   * - __ne: Not equal to given value.
   *
   * Example: getMultipleByFilters("employees", "salary", {"__gt": 4000})
   *  will return all entries in the objectStore "employees" which have
   * the property "salary" set to above 4000.
   *
   * @returns {Array}
   */
  getMultipleByFilters(objStore, key, value, limit) {
    let store = this.db.transaction([objStore]).objectStore(objStore)
    let matched = []

    store.openCursor().onsucces = evt => {
      var cursor = evt.target.result
      if (cursor) {
        if (typeof value !== "object" && cursor.value[key] === value) {
          matched.push(cursor.value)
        } else {
          if (typeof value === "object") {
            let matches = false,
              ref = cursor.value[key]
            switch (value.filter) {
              case "__lt":
                matches = ref < value.val
                break
              case "__lte":
                matches = ref <= value.val
                break
              case "__gt":
                matches = ref > value.val
                break
              case "__gte":
                matches = ref >= value.val
                break
              case "__ne":
                matches = ref !== value.val
                break
              case "__re":
                matches = value.val.test(ref)
                break
              default:
                matches = false
                break
            }
            if (matches) {
              matched.push(ref)
            }
          }
        }
        if (!limit || matched.length <= limit) {
          cursor.continue()
        }
      }
    }
    return matched
  }
}

export default db
