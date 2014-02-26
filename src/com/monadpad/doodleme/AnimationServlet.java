package com.monadpad.doodleme;


import java.io.IOException;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.Text;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;
import com.google.gson.Gson;

@SuppressWarnings("serial")
public class AnimationServlet extends HttpServlet{

	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
	
		resp.setContentType("text/plain");
	
		DatastoreService ds = DatastoreServiceFactory.getDatastoreService();
	
		String id = req.getParameter("id");
		if (id == null){
			resp.getWriter().print("bad");
		}
		else {
			Query q = new Query("Animations", KeyFactory.createKey("Animations", Long.parseLong(id)));
			
			Entity groove = ds.prepare(q).asSingleEntity();
			if (groove == null){
				resp.getWriter().print("bad") ;
			}
			else{
				resp.getWriter().print(((Text)groove.getProperty("json")).getValue()) ;

			}
		}
	}

	
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {

		DatastoreService ds = DatastoreServiceFactory.getDatastoreService();

		Entity doodle = null;
		String idParameter = req.getParameter("id");
		if (idParameter != null){
			Query q = new Query("Animations", KeyFactory.createKey("Animations", Long.parseLong(idParameter)));			
			doodle = ds.prepare(q).asSingleEntity();			
		}
		if (doodle == null){
			doodle = new Entity("Animations");
		}

		
		String json = req.getParameter("json");
		Gson gson = new Gson();
    	Header h = gson.fromJson(json, Header.class);
    	doodle.setProperty("title", h.title);

		doodle.setProperty("json", new Text(req.getParameter("json")));
		doodle.setProperty("userid", Long.parseLong(req.getParameter("userid")));
		

		
		Key grooveKey = ds.put(doodle);
		if (grooveKey != null)
			resp.getWriter().print(Long.toString(grooveKey.getId()));
		else
			resp.getWriter().print("bad");
	}

	static class Header {
		public String title = "";
	}

}
