package com.stiiick.database;

import android.content.Context;
import android.util.Log;


/**
 * @author Omar Basem
 */

public abstract class Database {

    protected SQLCipherOpenHelper databaseHelper;
    protected final Context context;

    public Database(Context context, SQLCipherOpenHelper databaseHelper) {
        this.context        = context;
        this.databaseHelper = databaseHelper;
        Log.d("XXX", "CALLING DATABASE ABSTRACT CONSTRUCTOR");
    }

}
