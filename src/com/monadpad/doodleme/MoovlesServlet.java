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

@SuppressWarnings("serial")
public class MoovlesServlet extends HttpServlet{

	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
	
		resp.setContentType("text/plain");
	
		DatastoreService ds = DatastoreServiceFactory.getDatastoreService();
	
		String id = req.getParameter("id");
		if (id == null){
			resp.getWriter().print("bad");
		}
		else {
			Query q = new Query("Moovles", KeyFactory.createKey("Moovles", Long.parseLong(id)));
			
			Entity groove = ds.prepare(q).asSingleEntity();
			if (groove == null){
				resp.getWriter().print("bad") ;
			}
			else{
				resp.getWriter().print("good:") ;
				resp.getWriter().print(((Text)groove.getProperty("xy")).getValue()) ;

			}
		}
	}

	
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {

		Entity doodle = new Entity("Moovles");
		doodle.setProperty("xy", new Text(req.getParameter("xy")));
		
		DatastoreService ds = DatastoreServiceFactory.getDatastoreService();
		Key grooveKey = ds.put(doodle);
		if (grooveKey != null)
			resp.getWriter().print(Long.toString(grooveKey.getId()));
		else
			resp.getWriter().print("bad");
	}
}
