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


import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;

import net.sqlcipher.database.SQLiteDatabase;

import androidx.annotation.Nullable;


public class FileDatabase extends Database {


    public  static final String TABLE_NAME  = "file";
    private static final String ID          = "id";
    public  static final String URI      = "uri";


    public static final String CREATE_TABLE = "CREATE TABLE " + TABLE_NAME +
            " (" + ID + " TEXT PRIMARY KEY, " + URI + " TEXT NOT NULL);";

    public static final String DROP_TABLE = "DROP TABLE " + TABLE_NAME + ";";

    FileDatabase(Context context, SQLCipherOpenHelper databaseHelper) {
        super(context, databaseHelper);
    }

    public @Nullable String getUri(String id) {
        SQLiteDatabase database = databaseHelper.fetchReadableDatabase();

        try (Cursor cursor = database.query(TABLE_NAME, null, ID + " = ?",
                new String[] {String.valueOf(id)},
                null, null, null))
        {
            if (cursor != null && cursor.moveToFirst()) {
                return cursor.getString(cursor.getColumnIndexOrThrow(URI));
            }
        }

        return null;
    }

    public void insertUri(String id, String uri) {
        SQLiteDatabase database = databaseHelper.fetchWritableDatabase();

        ContentValues contentValues = new ContentValues();
        contentValues.put(ID, id);
        contentValues.put(URI, uri);

        database.replace(TABLE_NAME, null, contentValues);
    }

    public void remove(String id) {
        SQLiteDatabase database = databaseHelper.fetchWritableDatabase();
        database.delete(TABLE_NAME, ID + " = ?", new String[] {id});
    }

}
