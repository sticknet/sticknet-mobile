/*
 *  Copyright (c) 2020-2021 STiiiCK.
 *
 *  This source code is licensed under the GPLv3 license found in the
 *  LICENSE file in the root directory of this source tree.
 */


package com.stiiick.database;

/**
 * @author Omar Basem
 */


import android.content.Context;
import android.util.Log;

import net.sqlcipher.database.SQLiteDatabase;

import androidx.annotation.NonNull;



public class DatabaseFactory {

    private static final Object lock = new Object();

    private static DatabaseFactory instance;

    private final SQLCipherOpenHelper databaseHelper;
    private final FileDatabase fileDatabase;


    public static DatabaseFactory getInstance(Context context) {
        synchronized (lock) {
            Log.d("XXX", "CALLING DATABASE FACTORY GET INSTANCE");
            if (instance == null) {
                Log.d("XXX", "INSTANCE == NULL");
                instance = new DatabaseFactory(context.getApplicationContext());
            } else {
                Log.d("XXX", "INSTANCE NOT NULL");
            }
            return instance;
        }
    }

    public static FileDatabase getFileDatabase(Context context) {
        Log.d("XXX", "CALLING GET FILE DATABASE");
        return getInstance(context).fileDatabase;
    }


    public static SQLiteDatabase getBackupDatabase(Context context) {
        return getInstance(context).databaseHelper.fetchReadableDatabase();
    }

    public void resetDatabase(Context context) {
        SQLiteDatabase db = getInstance(context).databaseHelper.fetchReadableDatabase();
        getInstance(context).databaseHelper.onUpgrade(db, db.getVersion(), db.getVersion() + 1);
    }


    private DatabaseFactory(@NonNull Context context) {
        SQLiteDatabase.loadLibs(context);
        DatabaseSecret databaseSecret = new DatabaseSecretProvider(context).getOrCreateDatabaseSecret();
        this.databaseHelper = new SQLCipherOpenHelper(context, databaseSecret);
        this.fileDatabase = new FileDatabase(context, databaseHelper);
    }
}
