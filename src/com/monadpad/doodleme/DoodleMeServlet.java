package com.monadpad.doodleme;

import java.io.IOException;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.Blob;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.Text;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;

import org.apache.commons.codec.binary.Base64;

@SuppressWarnings("serial")
public class DoodleMeServlet extends HttpServlet{

	

	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
	
		DatastoreService ds = DatastoreServiceFactory.getDatastoreService();

		boolean img = req.getParameter("img") != null && 
				req.getParameter("img").equals("true"); 
		
		boolean debugimg = req.getParameter("debugimg") != null && 
				req.getParameter("debugimg").equals("true"); 
		
		
		String id = req.getParameter("id");
		if (id == null){
			resp.setContentType("text/plain");
			resp.getWriter().print("bad");
		}
		else {
			Query q = new Query("Doodles", KeyFactory.createKey("Doodles", Long.parseLong(id)));
			
			Entity groove = ds.prepare(q).asSingleEntity();
			if (groove == null){
				resp.setContentType("text/plain");
				resp.getWriter().print("bad") ;
			}
			else if (img) {
//				byte[] imgarray = ((Blob)groove.getProperty("img")).getBytes();
//				String stuff = Base64.encodeBase64String(imgarray);
				if (debugimg) {
					resp.setContentType("text/plain");
				}
				else {
					resp.setContentType("image/png");
//					resp.setContentLength(stuff.length());
				}

				//for (int i = 0; i < imgarray.length; i++) {
				//	resp.getWriter().print(stuff);
				//}
				resp.getWriter().print(((Text)groove.getProperty("img")).getValue());
			}
			else if (groove.getProperty("code") == null) {
				resp.setContentType("text/plain");
				resp.getWriter().print("good:") ;
				resp.getWriter().print(((Text)groove.getProperty("xy")).getValue()) ;

			}
		}
	}

	
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {

		Entity doodle = new Entity("Doodles");
		doodle.setProperty("xy", new Text(req.getParameter("xy")));
		if (req.getParameter("img") != null){
			doodle.setProperty("img", new Text(req.getParameter("img")));
			
			//doodle.setProperty("img", new Blob(Base64.decodeBase64(req.getParameter("img"))));
		}
		
		String code = req.getParameter("code");
		if (code != null) {
			doodle.setProperty("code", code);			
		}
		
		DatastoreService ds = DatastoreServiceFactory.getDatastoreService();

		Key grooveKey = ds.put(doodle);
		if (grooveKey != null)
			resp.getWriter().print(Long.toString(grooveKey.getId()));
		else
			resp.getWriter().print("bad");
	}
	

}
