<!DOCTYPE html>
<html>
<style>
input {width:99%;}
</style>
<body>
Enter secret code:<br />
<form action="d.jsp" method="post">
<input name="code" />
<br/>
<input type="hidden" name="id" id="id" value="<%=request.getParameter("id")%>" />
<input type="submit" id="submit" />
</form>
</body>
</html>