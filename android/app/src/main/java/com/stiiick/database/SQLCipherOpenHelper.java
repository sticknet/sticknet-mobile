package com.stiiick.database;

/**
 * @author Omar Basem
 */

/*
 *  Copyright (c) 2020-2021 STiiiCK.
 *
 *  This source code is licensed under the GPLv3 license found in the
 *  LICENSE file in the root directory of this source tree.
 */



import android.content.Context;

import net.sqlcipher.database.SQLiteDatabase;
import net.sqlcipher.database.SQLiteOpenHelper;
import androidx.annotation.NonNull;


public class SQLCipherOpenHelper extends SQLiteOpenHelper {

    private static final int    DATABASE_VERSION = 1;
    private static final String DATABASE_NAME    = "stiiick.db";

    private final DatabaseSecret databaseSecret;

    public SQLCipherOpenHelper(@NonNull Context context, @NonNull DatabaseSecret databaseSecret) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);

        Context context1 = context.getApplicationContext();
        this.databaseSecret = databaseSecret;
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(FileDatabase.CREATE_TABLE);

    }


    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL(FileDatabase.DROP_TABLE);

        db.execSQL(FileDatabase.CREATE_TABLE);
    }

    public SQLiteDatabase fetchReadableDatabase() {
        return getReadableDatabase(databaseSecret.asString());
    }

    public SQLiteDatabase fetchWritableDatabase() {
        return getWritableDatabase(databaseSecret.asString());
    }

}
